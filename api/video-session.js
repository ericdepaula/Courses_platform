import { createStreamToken, ensureLessonAccess, getUserFromRequest, sendJson } from "./_lib/server.js";

export async function videoSessionHandler(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return sendJson(res, 401, { error: "Sessão inválida" });
  }

  const lessonId = req.query.lessonId;
  if (!lessonId) {
    return sendJson(res, 400, { error: "lessonId é obrigatório" });
  }

  try {
    const access = await ensureLessonAccess(user.id, String(lessonId));
    if (!access.allowed) {
      return sendJson(res, 403, { error: access.reason });
    }

    const token = createStreamToken({
      lessonId: access.lesson.id,
      userId: user.id,
    });

    return sendJson(res, 200, {
      token,
      lessonTitle: access.lesson.title,
      expiresInSeconds: 600,
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Erro interno",
    });
  }
}

export default videoSessionHandler;
