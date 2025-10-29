import Link from "next/link";

export default function CandidateStatsCard(props: any) {
  const { item, color } = props;

  return (
    <tr className={`h-12 table-row border`}>
      <td className="truncate pl-6 text-sm mt-2 flex items-center font-light">
        {item?.job_posting?.title}
      </td>
      <td className="truncate text-sm px-1 font-light text-xs lg:text-sm truncate">
        {item?.job_posting?.city}
        {item?.job_posting?.city && item?.job_posting?.state ? "," : ""}{" "}
        {item?.job_posting?.state}
      </td>
      <td className="truncate text-sm items-center font-light lg:max-w-[2vw] lg:min-w-[2vw]">
        <div>{new Date(item?.created_at).toLocaleDateString()}</div>
      </td>

      <td className="truncate px-1 text-sm mt-2 font-light items-center">
        {item?.inserted}
      </td>
      <td className="truncate px-1 mt-2 text-sm font-light items-center">
        {item?.failed}
      </td>
      <td
        style={{ color: color?.primaryAccent }}
        className="truncate font-light text-sm px-1 mt-2 items-center"
      >
        <Link href={item?.file}>Download</Link>
      </td>
    </tr>
  );
}
