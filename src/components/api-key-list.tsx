"use client";

import { useState } from "react";
import { useKeys } from "@/hooks/use-keys";
import { providers } from "@/lib/providers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiKeyForm } from "./api-key-form";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import type { ApiKey } from "@/lib/types";

export function ApiKeyList({ providerId }: { providerId?: string }) {
  const { keys, deleteKey } = useKeys();
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);

  const filteredKeys = providerId
    ? keys.filter((key) => key.providerId === providerId)
    : keys;

  const getProviderName = (id: string) => {
    return providers.find((p) => p.id === id)?.name || "Unknown";
  };
  
  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {!providerId && <TableHead>Provider</TableHead>}
              <TableHead>Label</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKeys.length > 0 ? (
              filteredKeys.map((key) => (
                <TableRow key={key.id}>
                  {!providerId && (
                    <TableCell className="font-medium">
                      {getProviderName(key.providerId)}
                    </TableCell>
                  )}
                  <TableCell>{key.label}</TableCell>
                  <TableCell className="font-mono">{maskKey(key.key)}</TableCell>
                  <TableCell>{key.priority}</TableCell>
                  <TableCell>
                    <Badge variant={key.status === "active" ? "default" : "secondary"}>
                      {key.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingKey(key)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteKey(key.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={providerId ? 5 : 6} className="h-24 text-center">
                  No API keys found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!editingKey} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle className="font-headline">Edit API Key</DialogTitle>
            </DialogHeader>
            {editingKey && (
                <ApiKeyForm
                    apiKey={editingKey}
                    onSuccess={() => setEditingKey(null)}
                    onCancel={() => setEditingKey(null)}
                />
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
