import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function AddTodoForm() {
  const [description, setDescription] = useState("");
  const addTodo = useMutation({
    mutationFn: useConvexMutation(api.todos.add),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        addTodo.mutate({ description });
        setDescription("");
      }}
    >
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button type="submit">Add</Button>
    </form>
  );
}
