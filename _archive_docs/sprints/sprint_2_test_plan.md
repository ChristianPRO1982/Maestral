# Sprint 2 Test Plan — Ubuntu Dual Instance (Master/Slave)

## Prerequisites

- Ubuntu machine with Node.js + npm installed.
- Two Chrome profiles:
  - Profile A: `Master`
  - Profile B: `Slave`

## Steps

1. Start Master instance:
   - Command: `npm run dev:master`
   - Expect: Vite serves on `http://localhost:5173`

2. Start Slave instance in a second terminal:
   - Command: `npm run dev:slave`
   - Expect: Vite serves on `http://localhost:5174`

3. Open harness pages:
   - Profile A -> `http://localhost:5173/test-harness`
   - Profile B -> `http://localhost:5174/test-harness`
   - Expect:
     - Role shown as `MASTER` on 5173 and `SLAVE` on 5174
     - Connection state starts as `idle`

4. Pair manually:
   - On Master:
     - Click `Create Offer`
     - Click `Copy Local SDP`
   - On Slave:
     - Paste into `Remote SDP`
     - Click `Create Answer`
     - Click `Copy Local SDP`
   - Back on Master:
     - Paste answer into `Remote SDP`
     - Click `Accept Answer / Connect`
   - Expect on both:
     - Peer/DataChannel state reaches connected/open

5. Validate event flow:
   - On Master click `Next Page`
   - Expect Slave logs a received `SYNC_TEST_NEXT`
   - On Slave click `Prev Page`
   - Expect Master logs a received `SYNC_TEST_PREV`

6. Validate reset guardrail:
   - Click `Reset Session` on each instance
   - Expect:
     - Connection state returns to `idle`
     - SDP fields are cleared
     - Logs are reset
