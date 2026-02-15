import { FastifyInstance } from 'fastify';

//Handlers
import {
  createCardRequestHandler,
  deleteCardRequestHandler,
  getCardRequestsHandler,
  getUserCardRequestHandler,
  updateCardRequestHandler,
} from './cardRequest.controller';

//Schemas
import {
  cardRequestRef,
  DeleteCardRequestInput,
  UpdateCardRequestInput,
} from './cardRequest.schema';
import { generalRef, PaginationInput } from '../general/general.schema';

export default async function cardRequestRoutes(app: FastifyInstance) {
  //Create new card request
  app.post(
    '/new',
    {
      preHandler: app.authenticate,
      schema: {
        tags: ['CardRequest', 'Users'],
        security: [{ bearerAuth: [] }],
        response: {
          201: cardRequestRef('generalCardRequestResponseSchema'),
          409: generalRef('conflictRequestSchema'),
        },
      },
    },
    createCardRequestHandler
  );

  //Get a user card request
  app.get(
    '/get',
    {
      preHandler: app.authenticate,
      schema: {
        tags: ['CardRequest', 'Users'],
        security: [{ bearerAuth: [] }],
      },
    },
    getUserCardRequestHandler
  );

  //Admin Routes

  //Get all card requests
  app.get<{ Querystring: PaginationInput }>(
    '/allRequests',
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ['CardRequest', 'Admins'],
        security: [{ bearerAuth: [] }],
        querystring: generalRef('paginationSchema'),
      },
    },
    getCardRequestsHandler
  );

  //Update a card request
  app.patch<{ Body: UpdateCardRequestInput }>(
    '/update',
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ['CardRequest', 'Admins'],
        security: [{ bearerAuth: [] }],
        body: cardRequestRef('updateCardRequestSchema'),
        response: {
          200: cardRequestRef('generalCardRequestResponseSchema'),
          401: generalRef('unauthorizedSchema'),
          403: generalRef('forbiddenSchema'),
        },
      },
    },
    updateCardRequestHandler
  );

  //Delete a card request
  app.delete<{ Params: DeleteCardRequestInput }>(
    '/delete/:requestId',
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ['CardRequest', 'Admins'],
        security: [{ bearerAuth: [] }],
        params: cardRequestRef('deleteCardRequestSchema'),
        response: {
          401: generalRef('unauthorizedSchema'),
          403: generalRef('forbiddenSchema'),
        },
      },
    },
    deleteCardRequestHandler
  );
}
