import express from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
} from "../controllers/friendRequest.controller";

const router = express.Router();

router.use(verifyJWT);

router.post("/send", sendFriendRequest);
router.put("/accept/:requestId", acceptFriendRequest);
router.put("/reject/:requestId", rejectFriendRequest);
router.get("/pending", getPendingRequests);

export default router;
