import {
  MoreHorizontal,
  NotebookPen,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
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
} from "../ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type React from "react";
import { getAllChatsService } from "@/services/chatServices";

type TCustomSidebarProps = {
  onNewChat: () => void;
  onPrevChat: (id: string) => void;
  children: React.ReactNode;
};

const CustomSidebar = ({
  onNewChat,
  onPrevChat,
  children,
}: TCustomSidebarProps) => {
  const [chatNames, setChatNames] = useState<{ id: string; title: string }[]>(
    Array.from({ length: 20 }, (_, index) => ({
      id: `${index}`,
      title: `PrevChat ${index + 1}`,
    }))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    const getAllChats = async () => {
      const chats = await getAllChatsService();

      if (typeof chats === "string") return;

      setChatNames(
        chats.data.map((chat) => ({
          id: chat.conversation_id,
          title: chat.title + "...",
        }))
      );
    };

    getAllChats();
  }, []);

  const handleRename = (index: number) => {
    setEditingIndex(index);
    setTempName(chatNames[index].title);
  };

  const handleSave = (index: number) => {
    if (tempName.trim()) {
      const newChatNames = [...chatNames];
      newChatNames[index].title = tempName.trim();
      setChatNames(newChatNames);
    }
    setEditingIndex(null);
    setTempName("");
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setTempName("");
  };

  const handleDelete = (index: number) => {
    const newChatNames = chatNames.filter((_, i) => i !== index);
    setChatNames(newChatNames);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      handleSave(index);
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
                onClick={onNewChat}
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
                {chatNames.map((chatName, index) => (
                  <SidebarMenuItem key={chatName.id}>
                    {editingIndex === index ? (
                      <div className="flex items-center gap-2 px-2 py-1">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          className="flex-1 bg-transparent border-b border-gray-400 outline-none text-sm py-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave(index)}
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
                          onClick={onPrevChat.bind(this, chatName.id)}
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
                              onClick={() => handleRename(index)}
                            >
                              <Pencil />
                              <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(index)}
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
      </Sidebar>
      <SidebarTrigger />

      {children}
    </SidebarProvider>
  );
};

export default CustomSidebar;
