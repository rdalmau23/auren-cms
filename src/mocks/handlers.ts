import { rest } from 'msw';

export const handlers = [
  // Mock Next-Auth session
  rest.get('*/api/auth/session', (req, res, ctx) => {
    return res(ctx.json({
      user: {
        id: 'prof-1',
        name: 'Dr. Test',
        email: 'dr@test.com',
        roles: ['PSYCHIATRIST'],
        accessToken: 'mock-token'
      },
      expires: '2099-01-01T00:00:00.000Z'
    }));
  }),

  // Mock Centers
  rest.get('*/v1/centers', (req, res, ctx) => {
    return res(ctx.json([]));
  }),

  // Mock Patients
  rest.get('*/v1/patients', (req, res, ctx) => {
    return res(ctx.json({
      content: [
        {
          id: 'pat-1',
          userId: 'user-pat-1',
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com',
          status: 'ACTIVE',
          riskLevel: 'LOW',
          centerName: 'Center A'
        },
        {
          id: 'pat-2',
          userId: 'user-pat-2',
          name: 'Jane',
          surname: 'Smith',
          email: 'jane@example.com',
          status: 'CRITICAL',
          riskLevel: 'HIGH',
          centerName: 'Center B'
        }
      ],
      totalElements: 2,
      totalPages: 1,
      page: 0
    }));
  }),
  
  // Mock delete patient
  rest.delete('*/v1/patients/:id', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // Mock Chat Conversations
  rest.get('*/v1/chat/conversations/with/:userId', (req, res, ctx) => {
    return res(ctx.json({
      id: 'conv-123',
      otherParticipantId: 'pat-1',
      otherParticipantName: 'John Doe',
      lastMessage: 'Hola',
      unreadCount: 0
    }));
  }),

  // Mock Chat Messages
  rest.get('*/v1/chat/conversations/:id/messages', (req, res, ctx) => {
    return res(ctx.json([
      {
        id: 'msg-1',
        senderId: 'pat-1',
        senderName: 'John Doe',
        content: 'Hola doctor',
        createdAt: new Date().toISOString()
      }
    ]));
  }),
];
