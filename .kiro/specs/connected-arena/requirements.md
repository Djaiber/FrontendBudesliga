# Requirements Document

## Introduction

The Connected Arena feature transforms the Live Predict match viewing experience into a real-time multiplayer second-screen experience. Users join rooms of 3-4 players, compete in prediction challenges, react with emojis, and climb leaderboards with tier-based rewards and streak multipliers. The system provides a social, competitive layer on top of the existing match viewing functionality.

## Glossary

- **Connected_Arena_System**: The complete real-time multiplayer layer including WebSocket transport, room management, prediction challenges, emoji reactions, and gamification
- **WebSocket_Client**: Singleton client managing bidirectional communication with the backend WebSocket server
- **Room**: A multiplayer session containing 3-4 players with a shared leaderboard
- **Prediction_Challenge**: A time-limited mini-game where players predict match events (goal scorer, event type, or sprint count)
- **Prediction_Window**: The time period (15-30 seconds) during which players can submit predictions for a challenge
- **Emoji_Reaction**: A Clash Royale-style emoji broadcast to all room members
- **Match_Event**: A real-time occurrence in the match (goal, shot, corner, free kick, sprint)
- **Leaderboard**: A ranked list of players in a room based on points earned
- **Tier**: A rank level (Bronze, Silver, Gold, Platinum, Diamond) based on cumulative performance
- **Streak_Multiplier**: A bonus multiplier applied to points for consecutive correct predictions
- **Room_Merge**: The consolidation of multiple rooms when player counts drop below threshold
- **Connection_Status**: The state of the WebSocket connection (connecting, connected, disconnected, error)
- **MatchDetailPage**: The existing React component displaying match details at `/live-predict/:matchId`
- **Cognito_ID_Token**: AWS Cognito authentication token from authStore used for WebSocket authentication

## Requirements

### Requirement 1: WebSocket Transport Layer

**User Story:** As a developer, I want a singleton WebSocket client with reconnection logic, so that the system maintains reliable real-time communication with the backend.

#### Acceptance Criteria

1. THE WebSocket_Client SHALL establish a connection to the URL specified in the VITE_WS_URL environment variable
2. WHEN establishing a connection, THE WebSocket_Client SHALL append the Cognito_ID_Token as a query parameter for authentication
3. WHEN the connection is lost, THE WebSocket_Client SHALL attempt to reconnect with exponential backoff starting at 1 second and capping at 30 seconds
4. THE WebSocket_Client SHALL send heartbeat messages every 30 seconds to maintain the connection
5. WHEN a heartbeat response is not received within 10 seconds, THE WebSocket_Client SHALL close and reconnect
6. THE WebSocket_Client SHALL expose a singleton instance accessible throughout the application
7. WHEN MatchDetailPage mounts, THE WebSocket_Client SHALL initiate the connection
8. WHEN MatchDetailPage unmounts, THE WebSocket_Client SHALL close the connection and clean up resources
9. THE WebSocket_Client SHALL emit connection status changes (connecting, connected, disconnected, error) to subscribers
10. THE WebSocket_Client SHALL parse incoming messages and route them to registered message handlers based on message type

### Requirement 2: Message Type System

**User Story:** As a developer, I want strongly-typed message definitions, so that client-server communication is type-safe and maintainable.

#### Acceptance Criteria

1. THE Connected_Arena_System SHALL define discriminated union types for all client-to-server messages
2. THE Connected_Arena_System SHALL define discriminated union types for all server-to-client messages
3. THE WebSocket_Client SHALL validate incoming message structure before routing to handlers
4. WHEN an invalid message is received, THE WebSocket_Client SHALL log an error and discard the message
5. THE Connected_Arena_System SHALL use TypeScript strict mode for all message type definitions

### Requirement 3: Room Management

**User Story:** As a player, I want to join rooms with 3-4 other players, so that I can compete in a shared multiplayer experience.

#### Acceptance Criteria

1. WHEN a player connects to a match, THE Connected_Arena_System SHALL assign the player to a Room with 3-4 total players
2. WHEN a player joins a Room, THE Connected_Arena_System SHALL broadcast a player-joined event to all Room members
3. WHEN a player leaves a Room, THE Connected_Arena_System SHALL broadcast a player-left event to all remaining Room members
4. THE Connected_Arena_System SHALL maintain a real-time list of active players in each Room
5. WHEN multiple Rooms drop below 3 players, THE Connected_Arena_System SHALL merge them into a single Room
6. WHEN a Room_Merge occurs, THE Connected_Arena_System SHALL send a merge notification to all affected players
7. THE Connected_Arena_System SHALL display the merge notification for 5 seconds with the new room composition

### Requirement 4: Prediction Challenge - Next Goal Scorer

**User Story:** As a player, I want to predict the next goal scorer, so that I can earn points for correct predictions.

#### Acceptance Criteria

1. WHEN a Next Goal Scorer challenge begins, THE Connected_Arena_System SHALL display a Prediction_Window with all eligible players as options
2. THE Prediction_Window SHALL remain open for 20 seconds
3. WHEN a player selects a goal scorer within the Prediction_Window, THE Connected_Arena_System SHALL submit the prediction to the server
4. WHEN the Prediction_Window expires, THE Connected_Arena_System SHALL disable further submissions
5. WHEN a goal is scored, THE Connected_Arena_System SHALL award 100 base points to players who predicted the correct scorer
6. WHEN a goal is scored, THE Connected_Arena_System SHALL apply the player's Streak_Multiplier to the base points
7. THE Connected_Arena_System SHALL display the challenge result with correct answer and points earned

### Requirement 5: Prediction Challenge - Next Event Type

**User Story:** As a player, I want to predict the next match event type, so that I can earn points for correct predictions.

#### Acceptance Criteria

1. WHEN a Next Event Type challenge begins, THE Connected_Arena_System SHALL display a Prediction_Window with event type options (corner, free kick, goal, shot)
2. THE Prediction_Window SHALL remain open for 15 seconds
3. WHEN a player selects an event type within the Prediction_Window, THE Connected_Arena_System SHALL submit the prediction to the server
4. WHEN the Prediction_Window expires, THE Connected_Arena_System SHALL disable further submissions
5. WHEN the predicted event occurs, THE Connected_Arena_System SHALL award 50 base points to players who predicted correctly
6. WHEN the predicted event occurs, THE Connected_Arena_System SHALL apply the player's Streak_Multiplier to the base points
7. THE Connected_Arena_System SHALL display the challenge result with correct answer and points earned

### Requirement 6: Prediction Challenge - Sprint Count

**User Story:** As a player, I want to predict the sprint count in the next 60 seconds, so that I can earn points for correct predictions.

#### Acceptance Criteria

1. WHEN a Sprint Count challenge begins, THE Connected_Arena_System SHALL display a Prediction_Window with numeric range options (0-2, 3-5, 6-8, 9+)
2. THE Prediction_Window SHALL remain open for 30 seconds
3. WHEN a player selects a range within the Prediction_Window, THE Connected_Arena_System SHALL submit the prediction to the server
4. WHEN the Prediction_Window expires, THE Connected_Arena_System SHALL disable further submissions
5. WHEN the 60-second observation period completes, THE Connected_Arena_System SHALL award 75 base points to players whose selected range contains the actual sprint count
6. WHEN the observation period completes, THE Connected_Arena_System SHALL apply the player's Streak_Multiplier to the base points
7. THE Connected_Arena_System SHALL display the challenge result with actual sprint count and points earned

### Requirement 7: Emoji Reactions

**User Story:** As a player, I want to send emoji reactions during the match, so that I can express emotions and interact with other players.

#### Acceptance Criteria

1. THE Connected_Arena_System SHALL provide an emoji picker with at least 8 emoji options
2. WHEN a player selects an emoji, THE Connected_Arena_System SHALL broadcast the emoji to all Room members within 200 milliseconds
3. WHEN an emoji is received, THE Connected_Arena_System SHALL display it on screen for 3 seconds with animation
4. THE Connected_Arena_System SHALL display the sender's name with each emoji reaction
5. THE Connected_Arena_System SHALL limit each player to 1 emoji every 2 seconds to prevent spam
6. WHEN a player attempts to send an emoji during the cooldown period, THE Connected_Arena_System SHALL show a visual indicator that the action is rate-limited

### Requirement 8: Match Event Feed

**User Story:** As a player, I want to see a real-time feed of match events, so that I stay informed about what's happening in the match.

#### Acceptance Criteria

1. THE Connected_Arena_System SHALL display a Match_Event feed showing the most recent 20 events
2. WHEN a Match_Event occurs, THE Connected_Arena_System SHALL add it to the feed within 500 milliseconds
3. THE Match_Event feed SHALL display event type, timestamp, and relevant details (player name, team)
4. THE Match_Event feed SHALL auto-scroll to show the most recent event
5. THE Connected_Arena_System SHALL synchronize the Match_Event feed across all Room members

### Requirement 9: Leaderboard

**User Story:** As a player, I want to see a real-time leaderboard, so that I can track my ranking against other players in my room.

#### Acceptance Criteria

1. THE Leaderboard SHALL display all players in the Room ranked by total points
2. WHEN a player earns points, THE Leaderboard SHALL update within 500 milliseconds
3. THE Leaderboard SHALL display each player's name, points, current streak, and tier
4. THE Leaderboard SHALL highlight the current player's row
5. THE Leaderboard SHALL show rank position (1st, 2nd, 3rd, 4th) for each player
6. THE Leaderboard SHALL animate rank changes when players move positions

### Requirement 10: Tier System

**User Story:** As a player, I want to progress through tiers based on my performance, so that I have long-term progression goals.

#### Acceptance Criteria

1. THE Connected_Arena_System SHALL assign players to one of five tiers: Bronze, Silver, Gold, Platinum, Diamond
2. WHEN a player reaches 500 cumulative points, THE Connected_Arena_System SHALL promote the player from Bronze to Silver
3. WHEN a player reaches 1500 cumulative points, THE Connected_Arena_System SHALL promote the player from Silver to Gold
4. WHEN a player reaches 3000 cumulative points, THE Connected_Arena_System SHALL promote the player from Gold to Platinum
5. WHEN a player reaches 5000 cumulative points, THE Connected_Arena_System SHALL promote the player from Platinum to Diamond
6. WHEN a player is promoted, THE Connected_Arena_System SHALL display a tier promotion notification for 5 seconds
7. THE Connected_Arena_System SHALL display the player's current tier badge on the Leaderboard

### Requirement 11: Streak Multiplier System

**User Story:** As a player, I want to earn streak multipliers for consecutive correct predictions, so that I'm rewarded for sustained accuracy.

#### Acceptance Criteria

1. WHEN a player makes a correct prediction, THE Connected_Arena_System SHALL increment the player's streak counter by 1
2. WHEN a player makes an incorrect prediction, THE Connected_Arena_System SHALL reset the player's streak counter to 0
3. WHEN a player has a streak of 3, THE Connected_Arena_System SHALL apply a 1.5x multiplier to earned points
4. WHEN a player has a streak of 5, THE Connected_Arena_System SHALL apply a 2.0x multiplier to earned points
5. WHEN a player has a streak of 10 or more, THE Connected_Arena_System SHALL apply a 3.0x multiplier to earned points
6. THE Connected_Arena_System SHALL display the current streak and active multiplier on the Leaderboard
7. WHEN a streak multiplier activates, THE Connected_Arena_System SHALL show a visual celebration effect

### Requirement 12: Connection Status Indicator

**User Story:** As a player, I want to see the connection status, so that I know if I'm connected to the multiplayer system.

#### Acceptance Criteria

1. THE Connected_Arena_System SHALL display a Connection_Status indicator in the UI
2. WHEN the Connection_Status is connecting, THE indicator SHALL display "Connecting..." with a loading animation
3. WHEN the Connection_Status is connected, THE indicator SHALL display "Connected" with a green indicator
4. WHEN the Connection_Status is disconnected, THE indicator SHALL display "Disconnected" with a red indicator
5. WHEN the Connection_Status is error, THE indicator SHALL display "Connection Error" with a red indicator
6. THE Connection_Status indicator SHALL be visible but unobtrusive in the top-right corner of MatchDetailPage

### Requirement 13: State Management

**User Story:** As a developer, I want Zustand stores for room and prediction state, so that state management is consistent with the existing architecture.

#### Acceptance Criteria

1. THE Connected_Arena_System SHALL provide a roomStore managing room state (players, leaderboard, room ID)
2. THE Connected_Arena_System SHALL provide a predictionStore managing active prediction challenges and windows
3. THE roomStore SHALL expose actions for updating player lists, leaderboard, and handling room merges
4. THE predictionStore SHALL expose actions for starting challenges, submitting predictions, and displaying results
5. THE stores SHALL follow the same patterns as existing authStore, matchStore, and betStore
6. THE stores SHALL not modify existing stores (authStore, languageStore, betStore, marketStore, matchStore)

### Requirement 14: Internationalization

**User Story:** As a player, I want the Connected Arena UI in my preferred language, so that I can understand all text and labels.

#### Acceptance Criteria

1. THE Connected_Arena_System SHALL add all UI strings to the en.ts translation file
2. THE Connected_Arena_System SHALL add all UI strings to the de.ts translation file
3. THE Connected_Arena_System SHALL use the existing useTranslation hook for all displayed text
4. THE translation keys SHALL follow the existing dot-notation pattern (e.g., "connectedArena.room.playerJoined")
5. THE Connected_Arena_System SHALL provide translations for all challenge types, tier names, and UI labels

### Requirement 15: Accessibility

**User Story:** As a player using assistive technology, I want accessible UI components, so that I can fully participate in the Connected Arena experience.

#### Acceptance Criteria

1. THE Connected_Arena_System SHALL provide ARIA labels for all interactive elements
2. THE Prediction_Window SHALL announce challenge start and time remaining to screen readers
3. THE Leaderboard SHALL use semantic HTML table structure with proper headers
4. THE emoji picker SHALL be keyboard navigable with arrow keys and Enter to select
5. THE Connection_Status indicator SHALL use role="status" and aria-live="polite"
6. THE Room_Merge notification SHALL use role="alert" and aria-live="assertive"
7. THE tier promotion notification SHALL use role="status" and aria-live="polite"

### Requirement 16: Responsive Design

**User Story:** As a mobile player, I want the Connected Arena UI to work on small screens, so that I can participate from my phone.

#### Acceptance Criteria

1. THE Connected_Arena_System SHALL use only existing CSS variables from login-template.css
2. THE Leaderboard SHALL stack vertically on screens below 768px width
3. THE Prediction_Window SHALL resize to fit mobile screens without horizontal scrolling
4. THE emoji picker SHALL display in a mobile-friendly grid on small screens
5. THE Match_Event feed SHALL remain readable on screens as small as 320px width
6. THE Connected_Arena_System SHALL use touch-friendly tap targets (minimum 44x44 pixels)

### Requirement 17: Error Handling

**User Story:** As a player, I want graceful error handling, so that temporary issues don't break my experience.

#### Acceptance Criteria

1. WHEN the WebSocket_Client fails to connect after 5 attempts, THE Connected_Arena_System SHALL display an error message with retry option
2. WHEN a prediction submission fails, THE Connected_Arena_System SHALL show an error toast and allow retry
3. WHEN an emoji broadcast fails, THE Connected_Arena_System SHALL fail silently without disrupting the UI
4. WHEN the Cognito_ID_Token is missing or invalid, THE WebSocket_Client SHALL not attempt to connect and SHALL log an error
5. WHEN a malformed message is received, THE WebSocket_Client SHALL log the error and continue processing other messages

### Requirement 18: Performance

**User Story:** As a player, I want low-latency interactions, so that the multiplayer experience feels responsive.

#### Acceptance Criteria

1. WHEN a player submits a prediction, THE Connected_Arena_System SHALL provide visual feedback within 100 milliseconds
2. WHEN an emoji is sent, THE Connected_Arena_System SHALL display it locally within 50 milliseconds
3. THE WebSocket_Client SHALL process incoming messages within 50 milliseconds of receipt
4. THE Leaderboard SHALL update within 500 milliseconds of a points change
5. THE Connected_Arena_System SHALL not block the main thread for more than 16 milliseconds during any operation

### Requirement 19: Integration with MatchDetailPage

**User Story:** As a developer, I want seamless integration with MatchDetailPage, so that Connected Arena features appear naturally in the existing UI.

#### Acceptance Criteria

1. THE Connected_Arena_System SHALL render the Connection_Status indicator in the MatchDetailPage header
2. THE Connected_Arena_System SHALL render the Leaderboard in the right column below MarketsFeed
3. THE Connected_Arena_System SHALL render the Match_Event feed in the right column below Leaderboard
4. THE Connected_Arena_System SHALL render the emoji picker as a floating button in the bottom-right corner
5. THE Connected_Arena_System SHALL render Prediction_Window challenges as modal overlays
6. THE Connected_Arena_System SHALL not interfere with existing MatchDetailPage functionality (scoreboard, metrics, pitch view, timeline, markets, bets)

### Requirement 20: Environment Configuration

**User Story:** As a developer, I want environment-based configuration, so that I can use different WebSocket endpoints for development and production.

#### Acceptance Criteria

1. THE WebSocket_Client SHALL read the WebSocket URL from the VITE_WS_URL environment variable
2. WHEN VITE_WS_URL is not defined, THE WebSocket_Client SHALL log an error and not attempt to connect
3. THE .env file SHALL include a VITE_WS_URL entry with a placeholder value
4. THE Connected_Arena_System SHALL not hardcode any backend URLs in source code
