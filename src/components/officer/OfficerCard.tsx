"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Briefcase, Calendar, Mail, MoreVertical, Shield } from "lucide-react";

export type Officer = {
  name: string;
  code: string;
  unit: string;
  email: string;
  joined: string;
  cases: number;
  initials: string;
  status: "active" | "inactive";
};

export default function OfficerCard({ officer }: { officer: Officer }) {
  return (
    <Card className="bg-[#0b0f14] border border-white/10 rounded-xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-semibold">
              {officer.initials}
            </div>
            <div>
              <p className="font-semibold text-white">{officer.name}</p>
              <p className="text-xs text-gray-400">{officer.code}</p>
            </div>
          </div>
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </div>

        <Badge
          className={
            officer.status === "active"
              ? "bg-green-600/20 text-green-400 w-fit"
              : "bg-red-600/20 text-red-400 w-fit"
          }
        >
          {officer.status === "active" ? "ACTIVE" : "INACTIVE"}
        </Badge>

        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {officer.unit}
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {officer.email}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Joined {officer.joined}
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            {officer.cases} assigned case{officer.cases > 1 ? "s" : ""}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3 px-5 pb-5">
        <Button variant="outline" className="flex-1">
          Edit
        </Button>
        <Button variant="secondary" className="flex-1">
          Deactivate
        </Button>
      </CardFooter>
    </Card>
  );
}
