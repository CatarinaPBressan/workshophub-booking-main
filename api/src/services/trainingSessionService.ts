import prisma from '../lib/prisma'

type RegistrationResult =
  | { kind: 'confirmed'; registration: Awaited<ReturnType<typeof prisma.registration.create>> }
  | {
      kind: 'waitlisted'
      registration: Awaited<ReturnType<typeof prisma.registration.create>>
      position: number
    }

export async function getAllSessions() {
  return prisma.trainingSession.findMany({
    orderBy: { date: 'asc' },
  })
}

export async function getSessionById(id: number) {
  return prisma.trainingSession.findUnique({
    where: { id },
  })
}

export async function createRegistration(
  sessionId: number,
  name: string,
  email: string
): Promise<RegistrationResult> {
  // Validate before any DB access so a rejected request never touches state.
  const trimmedName = typeof name === 'string' ? name.trim() : ''
  const trimmedEmail = typeof email === 'string' ? email.trim() : ''

  if (trimmedName === '' || trimmedEmail === '') {
    throw { status: 400, error: 'Name and email are required' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw { status: 400, error: 'Invalid email format' }
  }

  // Existence pre-check: a missing session must be 404, never a misleading 409.
  const session = await prisma.trainingSession.findUnique({ where: { id: sessionId } })
  if (!session) {
    throw { status: 404, error: 'Training session not found' }
  }

  return prisma.$transaction(async (tx) => {
    // When the session is at capacity, waitlist instead of confirming.
    if (session.registered >= session.capacity) {
      const existingWaitlisted = await tx.registration.count({
        where: { sessionId, status: 'waitlisted' },
      })

      const registration = await tx.registration.create({
        data: {
          sessionId,
          name: trimmedName,
          email: trimmedEmail,
          status: 'waitlisted',
        },
      })

      return { kind: 'waitlisted', registration, position: existingWaitlisted + 1 }
    }

    // The conditional update is the authorization to insert: its affected-row count
    // is the capacity decision, so the counter can never exceed capacity.
    const updated = await tx.trainingSession.updateMany({
      where: { id: sessionId, registered: { lt: session.capacity } },
      data: { registered: { increment: 1 } },
    })

    if (updated.count === 0) {
      // Session exists but is at capacity — abort the transaction with no writes.
      throw { status: 409, error: 'Training session is full' }
    }

    const registration = await tx.registration.create({
      data: {
        sessionId,
        name: trimmedName,
        email: trimmedEmail,
        status: 'confirmed',
      },
    })

    return { kind: 'confirmed', registration }
  })
}
