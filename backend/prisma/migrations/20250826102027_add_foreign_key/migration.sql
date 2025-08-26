/*
  Warnings:

  - The primary key for the `AllConversations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `AllConversations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."AllConversations_conversation_id_key";

-- AlterTable
ALTER TABLE "public"."AllConversations" DROP CONSTRAINT "AllConversations_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "AllConversations_pkey" PRIMARY KEY ("conversation_id");

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."AllConversations"("conversation_id") ON DELETE RESTRICT ON UPDATE CASCADE;
