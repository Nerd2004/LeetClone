import Topbar from "@/components/Topbar/Topbar";
import useHasMounted from "@/hooks/useHasMounted";
import Link from "next/link";
import { BsXCircle } from "react-icons/bs";
import { BsCheckCircle } from "react-icons/bs";
import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, firestore } from "@/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { DBProblem, contests } from "@/utils/types/problem";
import Countdown from "@/components/Countdown/Countdown";

type indexProps = {};

const index: React.FC<indexProps> = () => {
  const contest = GetContests();
  const upcomingcontest = GetUpcomingContests();
  const [loadingProblems, setLoadingProblems] = useState(true);
  const hasMounted = useHasMounted();
  const problems = useGetProblems(setLoadingProblems);
  const solvedProblems = useGetSolvedProblems();
  if (!hasMounted) return null;
  return (
    <>
      <main className="bg-dark-layer-2 min-h-screen">
        <Topbar />
        <h1
          className="text-2xl text-center text-gray-700 dark:text-gray-400 font-medium
                  uppercase mt-10 mb-5"
        >
          Upcoming Contests
        </h1>
        <div className="relative overflow-x-auto mx-auto px-6 pb-10">
          {loadingProblems && (
            <div className="max-w-[1200px] mx-auto sm:w-7/12 w-full animate-pulse">
              {[...Array(5)].map((_, idx) => (
                <LoadingSkeleton key={idx} />
              ))}
            </div>
          )}
          <table className="text-sm text-left text-gray-500 dark:text-gray-400 sm:w-7/12 w-full max-w-[1200px] mx-auto">
            {!loadingProblems && (
              <thead className="text-xs text-gray-700 uppercase dark:text-gray-400 border-b ">
                <tr>
                  <th scope="col" className="px-1 py-3 w-0 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-1 py-3 w-0 font-medium">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 w-0 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 w-0 font-medium">
                    Time
                  </th>
                </tr>
              </thead>
            )}
            <tbody className="text-white">
              {!loadingProblems && upcomingcontest.length > 0 ? (
                upcomingcontest.map((item, idx) => {
                  const myDate = new Date(item.starttime);
                  const now = Date.now();
                  const formattedDate = myDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                  });
                  return (
                    <tr
                      className={`${idx % 2 === 1 ? "bg-dark-layer-1" : ""}`}
                      key={item.id}
                    >
                      <th
                        className="px-2 py-4 font-medium whitespace-nowrap text-dark-green-s"
                        style={{
                          color: now >= item.starttime ? "green" : "red",
                        }}
                      >
                        {now >= item.starttime ? "Started" : "Not Started"}
                      </th>

                      <th className="px-2 py-4 font-medium whitespace-nowrap ">
                        {formattedDate}
                      </th>
                      <td className="px-6 py-4">
                        <Link
                          className="hover:text-blue-600 cursor-pointer"
                          href={`/contests/${item.id}`}
                        >
                          {item.id}
                        </Link>
                      </td>
                      <td className={`px-6 py-4 text-dark-blue-s`}>
                        <Countdown
                          startTime={item.starttime}
                          endTime={item.endtime}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <h2
                  className="text-2xl text-center text-gray-700 dark:text-gray-400 font-medium
                  uppercase mt-10 mb-5"
                ></h2>
              )}
            </tbody>
          </table>
        </div>
        <h1
          className="text-2xl text-center text-gray-700 dark:text-gray-400 font-medium
                  uppercase mt-10 mb-5"
        >
          Past Contests
          <div className="relative overflow-x-auto mx-auto px-6 pb-10">
            {loadingProblems && (
              <div className="max-w-[1200px] mx-auto sm:w-7/12 w-full animate-pulse">
                {[...Array(5)].map((_, idx) => (
                  <LoadingSkeleton key={idx} />
                ))}
              </div>
            )}
            <table className="text-sm text-left text-gray-500 dark:text-gray-400 sm:w-7/12 w-full max-w-[1200px] mx-auto">
              {!loadingProblems && (
                <thead className="text-xs text-gray-700 uppercase dark:text-gray-400 border-b ">
                  <tr>
                    <th scope="col" className="px-1 py-3 w-0 font-medium">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 w-0 font-medium">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 w-0 font-medium">
                      Standings
                    </th>
                  </tr>
                </thead>
              )}
              <tbody className="text-white">
                {!loadingProblems && contest.length > 0 ? (
                  contest.map((item, idx) => {
                    const myDate = new Date(item.starttime);
                    const formattedDate = myDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    });
                    return (
                      <tr
                        className={`${idx % 2 === 1 ? "bg-dark-layer-1" : ""}`}
                        key={item.id}
                      >
                        <th className="px-2 py-4 font-medium whitespace-nowrap ">
                          {formattedDate}
                        </th>
                        <td className="px-6 py-4">
                          <Link
                            className="hover:text-blue-600 cursor-pointer"
                            href={`/contests/${item.id}`}
                          >
                            {item.id}
                          </Link>
                        </td>
                        <td className={`px-6 py-4 text-dark-green-s`}>
                          <Link
                            className="hover:text-blue-600 cursor-pointer"
                            href={`/standings/${item.id}`}
                          >
                            VIEW
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <h2
                    className="text-2xl text-center text-gray-700 dark:text-gray-400 font-medium
                  uppercase mt-10 mb-5"
                  ></h2>
                )}
              </tbody>
            </table>
          </div>
        </h1>
      </main>
    </>
  );
};
export default index;

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
function useGetProblems(
  setLoadingProblems: React.Dispatch<React.SetStateAction<boolean>>
) {
  const [problems, setProblems] = useState<DBProblem[]>([]);

  useEffect(() => {
    const getProblems = async () => {
      // fetching data logic
      setLoadingProblems(true);
      const q = query(
        collection(firestore, "problems"),
        orderBy("order", "asc")
      );
      const querySnapshot = await getDocs(q);
      const tmp: DBProblem[] = [];
      querySnapshot.forEach((doc) => {
        tmp.push({ id: doc.id, ...doc.data() } as DBProblem);
      });
      setProblems(tmp);
      setLoadingProblems(false);
    };

    getProblems();
  }, [setLoadingProblems]);
  return problems;
}

function useGetSolvedProblems() {
  const [solvedProblems, setSolvedProblems] = useState<string[]>([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const getSolvedProblems = async () => {
      const userRef = doc(firestore, "users", user!.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        setSolvedProblems(userDoc.data().solvedProblems);
      }
    };

    if (user) getSolvedProblems();
    if (!user) setSolvedProblems([]);
  }, [user]);

  return solvedProblems;
}
function GetContests() {
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
        if (currentTime > contestData.endtime) {
          tmp.push(contestData);
          setcontest(tmp);
        }
      });
    };

    fetchContestData();
  }, []); // Empty dependency array to run once when component mounts

  return contest;
}

function GetUpcomingContests() {
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
        if (currentTime < contestData.endtime) {
          tmp.push(contestData);
          setcontest(tmp);
        }
      });
    };

    fetchContestData();
  }, []); // Empty dependency array to run once when component mounts

  return contest;
}
