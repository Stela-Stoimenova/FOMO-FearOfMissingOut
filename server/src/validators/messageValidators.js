import { z } from "zod";

export const sendMessageSchema = z.object({
    receiverId: z.number({ required_error: "receiverId is required" }).int().positive(),
    content: z.string().min(1, "content cannot be empty"),
});
