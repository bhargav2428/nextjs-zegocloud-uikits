import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import config from "../lib/config";
import { getRandomName } from "../lib/util";

export default function Home() {
  const root = useRef();
  const [roomID, setRoomID] = useState("");
  const [joined, setJoined] = useState(false); // Track whether the user has joined

  const handleRoomIDChange = (event) => {
    setRoomID(event.target.value);
  };

  const handleJoinClick = () => {
    if (root && roomID) {
      const userID = getRandomName();
      const appID = config.appID;
      let UIKitsConfig =
        JSON.parse(
          config.UIKitsConfig.replaceAll("\n", "")
            .replaceAll("\t", "")
            .replaceAll(/(\w+):/gi, '"$1":')
            .replaceAll(/,\s+\}/gi, "}")
        ) || {};

      let sharedLinks = [];

      if (UIKitsConfig && UIKitsConfig.scenario && UIKitsConfig.scenario.mode) {
        if (UIKitsConfig.scenario.mode === "OneONoneCall") {
          sharedLinks.push({
            name: "Personal link",
            url:
              window.location.origin +
              window.location.pathname +
              "?roomID=" +
              roomID,
          });
        } else if (UIKitsConfig.scenario.mode === "LiveStreaming") {
          // ... (existing LiveStreaming logic)
        } else if (
          UIKitsConfig.scenario.mode === "VideoConference" ||
          UIKitsConfig.scenario.mode === "GroupCall"
        ) {
          sharedLinks.push({
            name: "Personal link",
            url:
              window.location.origin +
              window.location.pathname +
              "?roomID=" +
              roomID,
          });
        }
      }

      fetch("./api/token", {
        method: "post",
        body: JSON.stringify({
          userID,
          expiration: 7200,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch token: ${res.statusText}`);
          }
          return res.json();
        })
        .then(async ({ token }) => {
          const { ZegoUIKitPrebuilt } = await import(
            "@zegocloud/zego-uikit-prebuilt"
          );
          const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
            appID,
            token,
            roomID,
            userID,
            getRandomName()
          );
          const zp = ZegoUIKitPrebuilt.create(kitToken);
          zp.joinRoom({
            container: root.current,
            sharedLinks,
            ...UIKitsConfig,
          });

          // Set the joined state to true after successfully joining the room
          setJoined(true);
        })
        .catch((error) => {
          console.error("Error fetching or processing token:", error);
          // Handle the error, e.g., show a message to the user
        });
    }
  };

  // Render the input and button only if the user has not joined
  if (!joined) {
    return (
      <div className="container">
        <Head>
          <title>Create VideoCall By ZEGOCLOUD UIKits</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main>
          <label>
            Room ID:
            <input type="text" value={roomID} onChange={handleRoomIDChange} />
          </label>

          {/* Add a "Join" button to trigger the handleJoinClick function */}
          <button onClick={handleJoinClick} disabled={!roomID}>
            Join Room
          </button>
        </main>

        <style jsx>{`
          .container {
            min-height: 100vh;
            padding: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          main {
            padding: 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
        `}</style>

        <style jsx global>{`
          html,
          body {
            padding: 0;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
              Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
              sans-serif;
          }

          * {
            box-sizing: border-box;
          }
        `}</style>
      </div>
    );
  }

  // If the user has joined, render only the video container
  return (
    <div className="container">
      <Head>
        <title>Create VideoCall By ZEGOCLOUD UIKits</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="videoContainer" ref={root}></div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .videoContainer {
          width: 100vw;
          height: 100vh;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
