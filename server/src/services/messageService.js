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

/** Get all conversations for a user (grouped by the other participant) */
export async function getConversations(userId) {
    // Fetch all messages where the user is either sender or receiver
    const messages = await prisma.message.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: "desc" },
        include: {
            sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
            receiver: { select: { id: true, name: true, role: true, avatarUrl: true } },
        },
    });

    // Group by the "other" user
    const convMap = new Map();
    for (const msg of messages) {
        const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        if (!convMap.has(otherId)) {
            const other = msg.senderId === userId ? msg.receiver : msg.sender;
            const unreadCount = messages.filter(
                m => m.senderId === otherId && m.receiverId === userId && !m.readAt
            ).length;
            convMap.set(otherId, {
                otherUser: other,
                lastMessage: msg,
                unreadCount,
            });
        }
    }

    return Array.from(convMap.values());
}

/** Get the full thread between the logged-in user and another user */
export async function getConversationThread(userId, otherUserId) {
    if (!Number.isInteger(otherUserId)) {
        const err = new Error("Invalid user id");
        err.status = 400;
        throw err;
    }

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId },
            ],
        },
        orderBy: { createdAt: "asc" },
        include: {
            sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
            receiver: { select: { id: true, name: true, role: true, avatarUrl: true } },
        },
    });

    // Mark unread messages as read (those sent TO the current user)
    const unreadIds = messages
        .filter(m => m.receiverId === userId && !m.readAt)
        .map(m => m.id);

    if (unreadIds.length > 0) {
        await prisma.message.updateMany({
            where: { id: { in: unreadIds } },
            data: { readAt: new Date() },
        });
    }

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
