"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiKeyForm } from "@/components/api-key-form";
import { useKeys } from "@/hooks/use-keys";
import { providers } from "@/lib/providers";
import { ApiKeyList } from "@/components/api-key-list";
import { PlusCircle, KeyRound, CheckCircle, BarChart, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { keys } = useKeys();
  const [isAddKeyOpen, setAddKeyOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your provider keys and monitor their status.
          </p>
        </div>
        <Dialog open={isAddKeyOpen} onOpenChange={setAddKeyOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Add New API Key</DialogTitle>
            </DialogHeader>
            <ApiKeyForm
              onSuccess={() => setAddKeyOpen(false)}
              onCancel={() => setAddKeyOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const providerKeys = keys.filter(
            (key) => key.providerId === provider.id
          );
          const activeKeys = providerKeys.filter(
            (key) => key.status === "active"
          );
          return (
            <Card key={provider.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-headline font-medium">
                  {provider.name}
                </CardTitle>
                <provider.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <span>{providerKeys.length} Keys</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{activeKeys.length} Active</span>
                  </div>
                </div>
                 <p className="text-xs text-muted-foreground mt-2">{provider.description}</p>
              </CardContent>
              <CardFooter>
                 <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">View Keys</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle className="font-headline">{provider.name} Keys</DialogTitle>
                      </DialogHeader>
                      <ApiKeyList providerId={provider.id} />
                    </DialogContent>
                  </Dialog>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="text-2xl font-headline font-bold tracking-tight mb-4">
          All API Keys
        </h2>
        <Card>
          <CardContent className="p-0">
             <ApiKeyList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
