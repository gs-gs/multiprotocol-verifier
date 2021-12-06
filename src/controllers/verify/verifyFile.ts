import { Request, Response } from "express"

export default async (req: Request, res: Response) => {
  return res.json({
    success: true,
    type: "file"
  })
}