import Link from "next/link";

export default function SignInHero(props: any) {
  const { role, page, company, color, theme } = props;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap mt-2 text-sm">
        Don&apos;t have an account yet?
        <Link
          style={{
            color: theme ? theme?.colors?.primary : color?.primaryAccent,
          }}
          href={role === "job-seeker" ? "/candidates/signup" : "/signup"}
          className="font-medium ml-2 cursor-pointer hover:opacity-75"
        >
          Sign Up!
        </Link>
      </div>
    </div>
  );
}
