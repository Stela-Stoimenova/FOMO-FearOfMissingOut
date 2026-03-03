import { prisma } from "../db.js";

/** Send a message from senderId to receiverId */
export async function sendMessage(senderId, receiverId, content) {
    if (senderId === receiverId) {
        const err = new Error("You cannot send a message to yourself");
        err.status = 400;
        throw err;
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
        const err = new Error("Recipient not found");
        err.status = 404;
        throw err;
    }

    const message = await prisma.message.create({
        data: { senderId, receiverId, content },
        include: {
            sender: { select: { id: true, name: true, role: true } },
            receiver: { select: { id: true, name: true, role: true } },
        },
    });

    return message;
}

/** Get inbox: messages received by userId */
export async function getInbox(userId) {
    const messages = await prisma.message.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: "desc" },
        include: {
            sender: { select: { id: true, name: true, role: true } },
        },
    });

    return messages;
}

/** Get sent messages by userId */
export async function getSentMessages(userId) {
    const messages = await prisma.message.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: "desc" },
        include: {
            receiver: { select: { id: true, name: true, role: true } },
        },
    });

    return messages;
}

/** Mark a message as read; only the receiver can do this */
export async function markMessageRead(messageId, userId) {
    if (!Number.isInteger(messageId)) {
        const err = new Error("Invalid message id");
        err.status = 400;
        throw err;
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message) {
        const err = new Error("Message not found");
        err.status = 404;
        throw err;
    }

    if (message.receiverId !== userId) {
        const err = new Error("You can only mark your own messages as read");
        err.status = 403;
        throw err;
    }

    if (message.readAt) {
        // Already read – return as-is (idempotent)
        return message;
    }

    const updated = await prisma.message.update({
        where: { id: messageId },
        data: { readAt: new Date() },
        include: {
            sender: { select: { id: true, name: true, role: true } },
        },
    });

    return updated;
}
