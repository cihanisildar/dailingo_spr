"use client";

import { useState } from "react";
import { useCreateCard } from "@/hooks/useCards";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  word: z.string().min(1, "Word is required"),
  definition: z.string().min(1, "Definition is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateCardDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createCard, isPending } = useCreateCard();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
      definition: "",
    },
  });

  function onSubmit(values: FormValues) {
    createCard(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white/20 text-white hover:bg-white/30 border-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Card</DialogTitle>
          <DialogDescription>
            Add a new flashcard with a word and its definition.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="word"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Word</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a word..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Definition</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the definition..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending ? "Creating..." : "Create Card"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 