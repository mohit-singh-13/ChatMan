import {
  MoreHorizontal,
  NotebookPen,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { startTransition, useEffect, useOptimistic, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import type React from "react";
import {
  deleteChatService,
  getAllChatsService,
  renameChatService,
} from "@/services/chatServices";
import ThemeToggle from "./ThemeToggle";
import { useSearchParams } from "react-router";

type TCustomSidebarProps = {
  onNewChat: () => void;
  onPrevChat: (id: string) => void;
  children: React.ReactNode;
};

type TChatName = {
  id: string;
  title: string;
};

const CustomSidebar = ({
  onNewChat,
  onPrevChat,
  children,
}: TCustomSidebarProps) => {
  const [chatNames, setChatNames] = useState<TChatName[]>([]);
  const [editingId, setEditingId] = useState<string>("");
  const [tempName, setTempName] = useState("");
  const [optimisticChatNames, updateOptimisticChatNames] = useOptimistic<
    TChatName[],
    TChatName[]
  >(chatNames, (_, updatedChatNames) => updatedChatNames);
  const [searchParams] = useSearchParams();
  const [selectedChat, setSelectedChat] = useState<string>(
    searchParams.get("id") || ""
  );

  useEffect(() => {
    const getAllChats = async () => {
      const chats = await getAllChatsService();

      if (!chats.success) return;

      setChatNames(
        chats.data.map((chat) => ({
          id: chat.conversation_id,
          title: chat.title,
        }))
      );
    };

    getAllChats();
  }, []);

  const handleRename = (id: string) => {
    setEditingId(id);

    const temp = chatNames.find((chat) => chat.id === id);
    if (!temp) return;
    setTempName(temp.title);
  };

  const handleSave = (id: string) => {
    if (tempName.trim()) {
      startTransition(() => {
        const updatedChatNames = optimisticChatNames.map((chat) =>
          chat.id === id ? { ...chat, title: tempName.trim() } : chat
        );

        updateOptimisticChatNames(updatedChatNames);
      });

      startTransition(async () => {
        const result = await renameChatService(id, tempName);

        if (result.success) {
          setChatNames((prev) =>
            prev.map((p) =>
              p.id === result.data.conversation_id
                ? { ...p, title: result.data.title }
                : p
            )
          );
        }
      });
    }

    setEditingId("");
    setTempName("");
  };

  const handleCancel = () => {
    setEditingId("");
    setTempName("");
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      const updatedChatNames = optimisticChatNames.filter(
        (chat) => chat.id !== id
      );

      updateOptimisticChatNames(updatedChatNames);
    });

    startTransition(async () => {
      const result = await deleteChatService(id);

      if (result.success) {
        setChatNames((prev) => prev.filter((p) => p.id !== id));
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSave(id);
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem className="text-center text-xl font-bold py-4 tracking-widest">
              ChatMan
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="text-[1rem] py-6"
                onClick={() => {
                  onNewChat();
                  setSelectedChat("");
                }}
              >
                <NotebookPen /> New Chat
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="custom-scrollbar">
          <SidebarGroup>
            <SidebarGroupLabel className="font-normal">
              Previous Chats
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {optimisticChatNames.map((chatName) => (
                  <SidebarMenuItem key={chatName.id}>
                    {editingId === chatName.id ? (
                      <div className="flex items-center gap-2 px-2 py-1">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, chatName.id)}
                          className="flex-1 bg-transparent border-b border-gray-400 outline-none text-sm py-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave(chatName.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Check className="w-3 h-3 text-green-600" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <SidebarMenuButton
                          className="py-5"
                          onClick={() => {
                            onPrevChat(chatName.id);
                            setSelectedChat(chatName.id);
                          }}
                          isActive={selectedChat === chatName.id}
                        >
                          {chatName.title}
                        </SidebarMenuButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuAction>
                              <MoreHorizontal />
                            </SidebarMenuAction>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuItem
                              onClick={() => handleRename(chatName.id)}
                            >
                              <Pencil />
                              <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(chatName.id)}
                            >
                              <Trash2 className="text-white" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem className="text-center">
              <ThemeToggle />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarTrigger />

      {children}
    </SidebarProvider>
  );
};

export default CustomSidebar;
