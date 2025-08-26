-- CreateTable
CREATE TABLE "public"."AllConversations" (
    "id" SERIAL NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "AllConversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllConversations_conversation_id_key" ON "public"."AllConversations"("conversation_id");
