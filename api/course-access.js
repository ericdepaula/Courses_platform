import { getAdminUser, getSupabase, readBody, sendJson } from "./_lib/server.js";

async function listUsers(courseIds) {
  const supabase = getSupabase();
  const ids = Array.isArray(courseIds) ? courseIds : [courseIds];
  const [{ data: enrollmentRows, error: enrollmentError }, { data: authUsersData, error: authUsersError }, { data: profileRows, error: profileError }] =
    await Promise.all([
      supabase
        .from("enrollments")
        .select("user_id, enrolled_at")
        .in("course_id", ids),
      supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
      supabase.from("profiles").select("id, role"),
    ]);

  if (enrollmentError) throw enrollmentError;
  if (authUsersError) throw authUsersError;
  if (profileError) throw profileError;

  const enrollmentsByUser = new Map(
    (enrollmentRows || []).map((row) => [row.user_id, row.enrolled_at]),
  );
  const rolesByUser = new Map((profileRows || []).map((row) => [row.id, row.role || "member"]));

  return (authUsersData.users || [])
    .map((user) => ({
      id: user.id,
      email: user.email || "Sem email",
      role: rolesByUser.get(user.id) || "member",
      hasAccess: enrollmentsByUser.has(user.id),
      enrolledAt: enrollmentsByUser.get(user.id) || null,
    }))
    .sort((left, right) => Number(right.hasAccess) - Number(left.hasAccess) || left.email.localeCompare(right.email));
}

export async function courseAccessHandler(req, res) {
  const supabase = getSupabase();
  const adminUser = await getAdminUser(req);
  if (!adminUser) {
    return sendJson(res, 401, { error: "Não autorizado" });
  }

  try {
    if (req.method === "GET") {
      const courseIdsParam = req.query.courseIds || req.query.courseId;
      const courseIds = String(courseIdsParam || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (courseIds.length === 0) return sendJson(res, 400, { error: "courseIds é obrigatório" });
      const users = await listUsers(courseIds);
      return sendJson(res, 200, { users });
    }

    const body = readBody(req);
    const courseIds = Array.isArray(body.courseIds)
      ? body.courseIds.filter(Boolean)
      : body.courseId
        ? [body.courseId]
        : [];
    const { userId } = body;
    if (courseIds.length === 0 || !userId) {
      return sendJson(res, 400, { error: "courseIds e userId são obrigatórios" });
    }

    if (req.method === "POST") {
      const payload = courseIds.map((courseId) => ({ course_id: courseId, user_id: userId }));
      const { error } = await supabase.from("enrollments").upsert(
        payload,
        { onConflict: "user_id,course_id" },
      );

      if (error) throw error;
      const users = await listUsers(courseIds);
      return sendJson(res, 200, { users });
    }

    if (req.method === "DELETE") {
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("id")
        .in("course_id", courseIds);

      if (lessonsError) throw lessonsError;

      const lessonIds = (lessons || []).map((lesson) => lesson.id);
      if (lessonIds.length > 0) {
        const { error: progressError } = await supabase
          .from("lesson_progress")
          .delete()
          .eq("user_id", userId)
          .in("lesson_id", lessonIds);
        if (progressError) throw progressError;
      }

      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("user_id", userId)
        .in("course_id", courseIds);

      if (error) throw error;
      const users = await listUsers(courseIds);
      return sendJson(res, 200, { users });
    }

    return sendJson(res, 405, { error: "Método não permitido" });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Erro interno",
    });
  }
}

export default courseAccessHandler;
