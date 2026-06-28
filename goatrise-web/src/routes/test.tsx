import { Button } from '@/components/ui/button';
import { auth } from '@/core/auth';
import { useAuthStore } from '@/stores/auth.store';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import axios from "axios";

const helloQueryOptions = queryOptions({
  queryKey: ['test'],
    queryFn: async() => {
      const res = await axios.get("http://localhost:3001/hello");
      return res.data;
    },
});

export const Route = createFileRoute('/test')({
  component: RouteComponent,
  loader: async ({context}) => {
    const serverString = await context.queryClient.ensureQueryData(helloQueryOptions);
    return { serverString };
  },
  head: ({loaderData}) => ({
    meta: [
      {title: `${loaderData?.serverString}`}
    ]
  })
});

function RouteComponent() {
  const {serverString} = Route.useLoaderData();

  const session = useAuthStore((s) => s.session);
  const isReady = useAuthStore((s) => s.isReady);
  const isAuthed = !!session;
  const helloQuery = useQuery(helloQueryOptions);

  if(helloQuery.isLoading) {
    return <div>Loading...</div>
  }

  async function signInGoogle() {
    console.log("clicked");
    await auth.signInWithOAuth({
      provider: "google",
    });
  }

  async function logOut() {
    await auth.signOut();
  }

  return (
    <main>
      <div>This is the text from server-side fetch: {serverString}</div>
      <div>This is the text from client-side useQuery: {helloQuery.data}</div>
      {isReady && (
        <>
          <Button onClick={signInGoogle} hidden={isAuthed}>Sign in</Button>
          <Button onClick={logOut} hidden={!isAuthed}>Sign out</Button>
        </>
      )}
    </main>
  );
}
