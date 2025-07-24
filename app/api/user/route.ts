import { auth } from "@/auth";

import { deleteUserById } from "@/lib/dto/user";

export const DELETE = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const currentUser = req.auth.user;
  if (!currentUser || !currentUser?.id) {
    return new Response("Invalid user", { status: 401 });
  }

  try {
    await deleteUserById(currentUser.id);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }

  return new Response("User deleted successfully!", { status: 200 });
});

export async function GET() {
  // Lấy user hiện tại từ session
  const session = await auth();
  if (!session?.user) {
    return Response.json({}, { status: 401 });
  }
  // Trả về id, email, name
  return Response.json({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });
}
