import { z } from "zod";

export const sendMessageSchema = z.object({
    receiverId: z.number({ required_error: "receiverId is required" }).int().positive(),
    content: z.string().min(1, "content cannot be empty").max(2000, "content cannot exceed 2000 characters"),
});
