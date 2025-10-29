import { colorToRGBA } from "../utils/misc";

export default function SkillTab(props: any) {
  const { skills, portal, color } = props;

  const renderList = skills.map((skill: any, key: any) => (
    <div
      key={key}
      className="inline-flex items-center justify-center rounded-full"
    >
      <button
        type="button"
        style={{
          color: color?.primaryAccent,
          backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
        }}
        className="flex items-center justify-center h-8 rounded-2xl px-3 "
      >
        <div className="text-sm">{skill}</div>
      </button>
    </div>
  ));

  return (
    <div
      className={`${
        portal === "job" ? "" : "justify-center"
      }flex gap-1 items-center flex-wrap py-1`}
    >
      {renderList}
    </div>
  );
}
