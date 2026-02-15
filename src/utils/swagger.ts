import { FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";

export const setupSwagger = async (app: FastifyInstance) => {
  // Register Swagger core first
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Commerce Bank API",
        description: "API documentation for Commerce Bank API Endpoint",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local server",
        },
      ],
      tags: [
        { name: "Users", description: "User-related endpoints" },
        { name: "Auth", description: "Authentication-related endpoints" },
        { name: "Transactions", description: "Transaction-related endpoints" },
        {
          name: "Notifications",
          description: "Notification-related endpoints",
        },
        { name: "Loans", description: "Loan-related endpoints" },
        { name: "Activities", description: "Activity-related endpoints" },
        { name: "Admins", description: "Administrative-related endpoints" },
        {
          name: "Beneficiaries",
          description: "Beneficiaries-related endpoints",
        },
        { name: "Savings", description: "Savings-related endpoints" },
        { name: "Accounts", description: "Account-related endpoints" },
        { name: "Deposits", description: "Deposit Requests-related endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  // Then register the UI plugin
  await app.register(fastifySwaggerUI, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
  });
};
