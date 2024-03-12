import Topbar from "@/components/Topbar/Topbar";
import useHasMounted from "@/hooks/useHasMounted";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/firebase/firebase";
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";
import { contests } from "@/utils/types/problem";

export default function standings() {
  const router = useRouter();

  const id: string = Array.isArray(router.query?.id)
    ? router.query.id[0]
    : router.query?.id || "";
  if (!id) {
    // Handle the case when id is not yet available (e.g., show loading spinner)
    return <div>Loading...</div>;
  }

  const [loading, setLoading] = useState(true);
  const contest = GetContests(id, setLoading)[0];
  var comb;
  if (contest) {
    const scores = contest.score;
    const standings = contest.standings;
    const solved = contest.count;

    // Combine scores, standings, and solved into an array of objects
    const combinedArray = standings.map((email, index) => ({
      email,
      score: scores[index],
      solved: solved[index], // Add solved count to the combined array
    }));

    // Sort the combined array based on the number of problems solved (descending order) and then by scores (ascending order)
    combinedArray.sort((a, b) => {
      if (a.solved !== b.solved) {
        // If the number of problems solved is different, sort by solved count
        return b.solved - a.solved; // Sort by solved count in descending order
      } else {
        // If the number of problems solved is the same, sort by score
        return a.score - b.score; // Sort by score in ascending order
      }
    });
    comb = combinedArray;
  }

  function padZero(hours: any): React.ReactNode {
    throw new Error("Function not implemented.");
  }

  return (
    <>
      <main className="bg-dark-layer-2 min-h-screen">
        <Topbar />
        <h1
          className="text-2xl text-center text-gray-700 dark:text-gray-400 font-medium
					uppercase mt-10 mb-5"
        >
          {id} Leaderboard
        </h1>
        <div className="relative overflow-x-auto mx-auto px-6 pb-10">
          {loading && (
            <div className="max-w-[1200px] mx-auto sm:w-7/12 w-full animate-pulse">
              {[...Array(10)].map((_, idx) => (
                <LoadingSkeleton key={idx} />
              ))}
            </div>
          )}
          <table className="text-sm text-left text-gray-500 dark:text-gray-400 sm:w-7/12 w-full max-w-[1200px] mx-auto">
            {!loading && (
              <thead className="text-xs text-gray-700 uppercase dark:text-gray-400 border-b ">
                <tr>
                  <th scope="col" className="px-3 py-3 w-0 font-medium">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 w-0 font-medium">
                    User
                  </th>
                  <th scope="col" className="px-4 py-3 w-0 font-medium">
                    Solved
                  </th>

                  <th scope="col" className="px-6 py-3 w-0 font-medium">
                    Time
                  </th>
                </tr>
              </thead>
            )}
            <tbody className="text-white">
              {!loading && comb ? (
                comb.map((item, idx) => {
                  const formatTime = (milliseconds) => {
                    const padZero = (num) => num.toString().padStart(2, "0");
                    const hours = Math.floor(milliseconds / 3600000);
                    const minutes = Math.floor(
                      (milliseconds % 3600000) / 60000
                    );
                    const seconds = Math.floor((milliseconds % 60000) / 1000);
                    return `${padZero(hours)}:${padZero(minutes)}:${padZero(
                      seconds
                    )}`;
                  };

                  const formattedTime = formatTime(item.score);

                  return (
                    <tr
                      className={`${idx % 2 === 1 ? "bg-dark-layer-1" : ""}`}
                      key={idx}
                    >
                      <th className="px-3 py-4 font-medium whitespace-nowrap">
                        {idx + 1}
                      </th>
                      <td className="px-6 py-4">{item.email}</td>
                      <td className="px-6 py-4">{item.solved}</td>
                      <td className={`px-6 py-4 text-dark-green-s`}>
                        {formattedTime}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <h1
                  className="text-2xl text-center text-gray-700 dark:text-gray-400 font-medium
					uppercase mt-10 mb-5"
                >
                  Fetching The LeaderBoard...
                </h1>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

const LoadingSkeleton = () => {
  return (
    <div className="flex items-center space-x-12 mt-4 px-6">
      <div className="w-6 h-6 shrink-0 rounded-full bg-dark-layer-1"></div>
      <div className="h-4 sm:w-52  w-32  rounded-full bg-dark-layer-1"></div>
      <div className="h-4 sm:w-52  w-32 rounded-full bg-dark-layer-1"></div>
      <div className="h-4 sm:w-52 w-32 rounded-full bg-dark-layer-1"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};
function GetContests(
  id: string,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  const [contest, setcontest] = useState<contests[]>([]);

  useEffect(() => {
    const fetchContestData = async () => {
      // Get current time in milliseconds
      const currentTime = Math.floor(new Date().getTime());

      // Query the contests collection
      const q = query(collection(firestore, "contests"));

      const querySnapshot = await getDocs(q);

      // Loop through each document in the collection
      const tmp: contests[] = [];
      querySnapshot.forEach((doc) => {
        const contestData = doc.data() as contests;

        // Check if the current time is past the end time of the contest
        if (contestData.id === id) {
          tmp.push(contestData);
          setcontest(tmp);
        }
      });
    };

    fetchContestData();
    setLoading(false);
  }, []); // Empty dependency array to run once when component mounts

  return contest;
}
