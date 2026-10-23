import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { listProjects, createProject, listProjectMembers, inviteToProject, ensureDemoProfiles, getProfileByUsername } from "@/lib/storage"

export const dynamic = "force-dynamic"

export async function GET() {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const projects = await listProjects(user.id)
  return NextResponse.json({ projects })
}

export async function POST(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const body = await req.json()
  // invite flow
  if (body.projectId && body.inviteUsername) {
    const profile = await getProfileByUsername(body.inviteUsername)
    if (!profile) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
    const m = await inviteToProject(body.projectId, profile.id, user.id)
    return NextResponse.json({ ok: true, member: m })
  }
  const { name, description, inviteUsernames } = body as { name?: string; description?: string; inviteUsernames?: string[] }
  if (!name) return NextResponse.json({ error: "Proje adı gerekli" }, { status: 400 })
  // resolve invite ids
  const inviteIds: string[] = []
  if (inviteUsernames?.length) {
    for (const u of inviteUsernames) {
      const p = await getProfileByUsername(u.trim())
      if (p) inviteIds.push(p.id)
    }
  }
  const project = await createProject(name, description || "", user.id, inviteIds)
  return NextResponse.json({ ok: true, project }, { status: 201 })
}

// GET members? /api/projects?projectId=xxx
export async function PUT(req: Request) {
  await ensureDemoProfiles()
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "projectId gerekli" }, { status: 400 })
  const members = await listProjectMembers(projectId)
  return NextResponse.json({ members })
}
