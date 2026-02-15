import { Server } from "socket.io";

//Services
import {
  createNotification,
  getUserNotifications,
} from "../modules/notifications/notifications.services";
import {
  updateOnlineStatus,
  updateUser,
  updateUserSession,
} from "../modules/user/user.service";
import { updateAdminStatus } from "../modules/admin/admin.service";
import {
  saveMessage,
  getAllConversations,
  markAllMessages,
  deleteMessage,
} from "../libs/message";

//Utils, Libs and Configs
import { allowedOrigins } from "./cors";
import { sendEmail } from "../libs/mailer";

//Emails
import suspensionEmail from "../emails/suspension";
import restoredEmail from "../emails/unsuspended";

let io: Server;
const onlineUsers = new Map<string, string>();

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, origin);
        } else {
          cb(new Error("Not allowed by CORS"), false);
        }
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join room and track online
    socket.on("joinRoom", async ({ userId, isAdmin, adminConnect }) => {
      //Admin
      if (userId && isAdmin) {
        //Join and update admin status
        socket.join(adminConnect);
        await updateAdminStatus(userId);

        // Fetch all conversations and emit back
        const conversations = await getAllConversations(adminConnect, isAdmin);
        io.to(adminConnect).emit("userConversations", { conversations });
      } else {
        //Join, update online status and session
        socket.join(userId);
        onlineUsers.set(userId, socket.id);
        await updateOnlineStatus(userId, true);

        //Fetch Notifications
        const userNotifications = await getUserNotifications(userId);
        io.to(userId).emit("allNotifications", userNotifications);

        //Fetch conversations
        const conversations = await getAllConversations(userId, false);
        io.to(userId).emit("userConversations", { conversations });
      }
    });

    // Send Message
    socket.on(
      "sendMessage",
      async (
        {
          id,
          from,
          to,
          text,
        }: { id: string; from: string; to: string; text: string },
        callback: (response: {
          success: boolean;
          message: string;
          data?: any;
        }) => void
      ) => {
        try {
          const timestamp = Date.now();

          await saveMessage({
            id,
            from,
            to,
            text,
            timestamp,
          });

          // Notify receiver
          io.to(to).emit("newMessage", {
            id,
            from,
            to,
            text,
            timestamp,
            status: "successful",
          });

          // Acknowledge sender immediately
          if (typeof callback === "function") {
            callback({
              success: true,
              message: "Message sent successfully",
              data: {
                id,
                to,
                from,
                text,
                timestamp,
                status: "successful",
              },
            });
          }
        } catch (error) {
          console.error("sendMessage error:", error);
          if (typeof callback === "function") {
            callback({
              success: false,
              message: "Failed to send message",
            });
          }
        }
      }
    );

    //Delete Message
    socket.on(
      "deleteMessage",
      async (
        {
          id,
          from,
          to,
        }: {
          id: string;
          from: string;
          to: string;
        },
        callback: (response: { success: boolean; message: string }) => void
      ) => {
        try {
          await deleteMessage({ messageId: id, from, to });

          // Notify both users to remove the message from their view
          io.to(from).emit("messageDeleted", { id });
          io.to(to).emit("messageDeleted", { id });

          if (typeof callback === "function") {
            callback({
              success: true,
              message: "Message deleted successfully",
            });
          }
        } catch (error) {
          console.error("Failed to delete message:", error);
          if (typeof callback === "function") {
            callback({ success: false, message: "Message deletion failed" });
          }
        }
      }
    );

    // Typing
    socket.on("typing", ({ to, from, isTyping }) => {
      io.to(to).emit("typing", { from, isTyping });
    });

    //Get all Conversations
    socket.on("getAllConversations", async ({ userId, isAdmin }) => {
      const conversations = await getAllConversations(userId, isAdmin);
      socket.emit("userConversations", { conversations });
    });

    // Mark All Messages As Read
    socket.on(
      "markAsRead",
      async (
        { userId, otherUserId }: { userId: string; otherUserId: string },
        callback: (response: { success: boolean; message: string }) => void
      ) => {
        try {
          await markAllMessages(userId, otherUserId);

          const otherSocketId = onlineUsers.get(otherUserId);
          if (otherSocketId) {
            io.to(otherSocketId).emit("messagesRead", {
              readerId: userId,
              conversationWith: otherUserId,
            });
          }
          if (typeof callback === "function") {
            callback({
              success: true,
              message: "Messages successfully marked as read successfully.",
            });
          }
        } catch (error) {
          if (typeof callback === "function") {
            callback({
              success: false,
              message: "Mark messages as read failed",
            });
          }
          console.error("Failed to mark message as read:", error);
        }
      }
    );

    //Logout a user
    socket.on(
      "logoutUser",
      async (
        { userId }: { userId: string },
        callback: (response: { success: boolean; message: string }) => void
      ) => {
        try {
          await updateUserSession(userId);
          io.to(userId).emit("offline");
          if (typeof callback === "function") {
            callback({
              success: true,
              message: "User was logged out successfully.",
            });
          }
        } catch (error) {
          if (typeof callback === "function") {
            callback({ success: false, message: "Failed to log out user" });
          }
          console.error("Failed to log out user:", error);
        }
      }
    );

    //Suspend a user
    socket.on(
      "suspendUser",
      async (
        {
          userId,
          email,
          suspended,
        }: { userId: string; email: string; suspended: boolean },
        callback: (response: { success: boolean; message: string }) => void
      ) => {
        try {
          const data = { email, isSuspended: suspended };
          const updatedUser = await updateUser(data);

          if (updatedUser !== null) {
            const template =
              suspended === true
                ? suspensionEmail({ name: updatedUser.fullName }).html
                : restoredEmail({ name: updatedUser.fullName }).html;

            await sendEmail({
              to: updatedUser.email,
              subject:
                suspended === true
                  ? suspensionEmail({ name: updatedUser.fullName }).subject
                  : restoredEmail({ name: updatedUser.fullName }).subject,
              html: template,
            });
            io.to(userId).emit("suspended");
            if (typeof callback === "function") {
              callback({
                success: true,
                message: "The user was suspended successfully.",
              });
            }
          }
        } catch (error) {
          if (typeof callback === "function") {
            callback({ success: false, message: "User suspension failed" });
          }
          console.error("Failed to mark message as read:", error);
        }
      }
    );

    // Disconnect Handler
    socket.on("disconnect", async () => {
      const userId = [...onlineUsers.entries()].find(
        ([_, id]) => id === socket.id
      )?.[0];
      if (userId) {
        onlineUsers.delete(userId);
        await updateUserSession(userId);
        await updateOnlineStatus(userId, false);
        io.emit("userOffline", { userId });
        console.log(`User ${userId} went offline`);
      }

      console.log("Socket disconnected:", socket.id);
    });
  });
};

//Function to emit and save a users notifications
export const emitAndSaveNotification = async ({
  user,
  type,
  subtype,
  title,
  message,
  data,
}: {
  user: string;
  type: string;
  subtype: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}) => {
  const notification = await createNotification(user, {
    type,
    subtype,
    title,
    message,
    data,
  });

  if (io) {
    io.to(user).emit("notification", notification);
  }

  return notification;
};
