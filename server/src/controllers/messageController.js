import { sendMessage, getInbox, getSentMessages, markMessageRead } from "../services/messageService.js";

export async function send(req, res, next) {
    try {
        const { receiverId, content } = req.body;
        const message = await sendMessage(req.user.userId, receiverId, content);
        return res.status(201).json(message);
    } catch (err) {
        return next(err);
    }
}

export async function inbox(req, res, next) {
    try {
        const messages = await getInbox(req.user.userId);
        return res.json(messages);
    } catch (err) {
        return next(err);
    }
}

export async function sent(req, res, next) {
    try {
        const messages = await getSentMessages(req.user.userId);
        return res.json(messages);
    } catch (err) {
        return next(err);
    }
}

export async function markRead(req, res, next) {
    try {
        const messageId = Number(req.params.id);
        const message = await markMessageRead(messageId, req.user.userId);
        return res.json(message);
    } catch (err) {
        return next(err);
    }
}
