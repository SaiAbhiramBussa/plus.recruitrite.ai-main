import Image from "next/image";
import { colorToRGBA } from "../utils/misc";

export default function UserCard(props: any) {
  const { user, key, selectedUsers, handleCheckboxChange, color } = props;

  return (
    <div
      key={key}
      className={`relative py-4 mx-2 shadow items-center rounded flex mb-1 ${
        selectedUsers.includes(user.id) && "border-2 "
      }`}
    >
      <div className="flex items-center">
        <input
          type="checkbox"
          className="h-4 w-4 lg:ml-2 mr-1 xl:mr-2 cursor-pointer"
          id={user.id}
          checked={selectedUsers && selectedUsers.includes(user.id)}
          onChange={(e) => handleCheckboxChange(user.id, e.target.checked)}
        />
        <div
          style={{ color: color?.secondaryAccent }}
          className="flex flex-wrap text-sm text-left font-medium w-full truncate overflow-hidden overflow-ellipsis"
        >
          {user?.picture ? (
            <Image
              src={user?.picture}
              width={8}
              height={8}
              className="w-8 rounded-full h-8 mr-2"
              alt=""
            />
          ) : (
            <>
              <div
                style={{
                  backgroundColor: color?.primaryAccent,
                  color: colorToRGBA(color?.secondaryAccent, color?.opacity),
                }}
                className="h-8 w-8 rounded-full justify-center items-center flex text-sm font-semibold"
              >
                {user?.first_name[0] + " " + user?.last_name[0]}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="ml-2">
        <div className="text-sm  max-w-[10vw] min-w-[10vw] font-semibold truncate">
          {user?.first_name} {user.last_name}
        </div>
        <div className="text-xs max-w-[10vw] min-w-[10vw] truncate">
          {user?.email}
        </div>
      </div>
    </div>
  );
}
