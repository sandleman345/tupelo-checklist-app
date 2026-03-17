export const dynamic = "force-dynamic";

import ManagerLoginClient from "./ManagerLoginClient";

type SearchParams = Promise<{ redirect?: string }>;

export default async function ManagerLoginPage(props: {
  searchParams?: SearchParams;
}) {
  const params = (await props.searchParams) || {};
  const redirect = params.redirect || "/manager";

  return <ManagerLoginClient redirectTo={redirect} />;
}