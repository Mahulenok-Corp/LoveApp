import { NextFunction, Request, Response } from "express";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const ids = [822272964, 425595848];
  const id = req["user"].id;
  if (ids.includes(id)) {
    next();
  } else {
    res.status(500).json("Forbidden");
  }
};
