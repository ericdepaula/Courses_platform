import { ensureLessonAccess, getDriveClient, verifyStreamToken } from "./_lib/server.js";

function sendError(res, status, message) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: message }));
}

function parseRangeHeader(rangeHeader, totalSize) {
  const match = String(rangeHeader || "").match(/bytes=(\d*)-(\d*)/);
  if (!match) return null;

  const start = match[1] ? Number(match[1]) : 0;
  const requestedEnd = match[2] ? Number(match[2]) : totalSize - 1;
  const end = Math.min(requestedEnd, totalSize - 1);

  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || start > end) {
    return null;
  }

  return { start, end };
}

export async function videoStreamHandler(req, res) {
  const token = req.query.token;
  const payload = verifyStreamToken(token);

  if (!payload?.lessonId || !payload?.userId) {
    return sendError(res, 401, "Token de streaming inválido");
  }

  try {
    const access = await ensureLessonAccess(payload.userId, payload.lessonId);
    if (!access.allowed) {
      return sendError(res, 403, access.reason);
    }

    const drive = await getDriveClient();
    const metadataResponse = await drive.files.get({
      fileId: access.lesson.video_url,
      fields: "size,mimeType",
    });

    const totalSize = Number(metadataResponse.data.size || 0);
    const mimeType = metadataResponse.data.mimeType || "video/mp4";
    const parsedRange = totalSize > 0 ? parseRangeHeader(req.headers.range, totalSize) : null;
    const driveResponse = await drive.files.get(
      { fileId: access.lesson.video_url, alt: "media" },
      {
        responseType: "stream",
        headers: parsedRange ? { Range: `bytes=${parsedRange.start}-${parsedRange.end}` } : undefined,
      },
    );

    if (parsedRange && totalSize > 0) {
      const chunkSize = parsedRange.end - parsedRange.start + 1;
      res.statusCode = 206;
      res.setHeader("accept-ranges", "bytes");
      res.setHeader("content-range", `bytes ${parsedRange.start}-${parsedRange.end}/${totalSize}`);
      res.setHeader("content-length", String(chunkSize));
    } else {
      res.statusCode = 200;
      res.setHeader("accept-ranges", "bytes");
      if (totalSize > 0) {
        res.setHeader("content-length", String(totalSize));
      }
    }

    res.setHeader("content-type", mimeType);
    res.setHeader("cache-control", "private, no-store, no-cache, must-revalidate");
    res.setHeader("x-content-type-options", "nosniff");

    driveResponse.data.on("error", () => {
      if (!res.writableEnded) {
        res.destroy();
      }
    });

    driveResponse.data.pipe(res);
  } catch (error) {
    return sendError(res, 500, error instanceof Error ? error.message : "Erro interno");
  }
}

export default videoStreamHandler;
