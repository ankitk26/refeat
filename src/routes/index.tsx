import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import AddTodoForm from "~/components/add-todo-form";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useSuspenseQuery(convexQuery(api.todos.get, {}));

  return (
    <div>
      <h1 className="text-2xl font-bold">Todos</h1>
      <div>
        {data.map(({ _id, description }) => (
          <div key={_id}>{description}</div>
        ))}
      </div>

      <h1 className="mt-4 text-xl font-bold">Form input</h1>
      <AddTodoForm />
    </div>
  );
}
