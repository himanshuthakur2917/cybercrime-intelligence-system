"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Briefcase,
  Calendar,
  Mail,
  MoreVertical,
  Shield,
  Trash2,
} from "lucide-react";

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

interface OfficerCardProps {
  officer: Officer;
  onDeactivate?: () => void;
  onReactivate?: () => void;
  onDelete?: () => void;
}

export default function OfficerCard({
  officer,
  onDeactivate,
  onReactivate,
  onDelete,
}: OfficerCardProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold tabular-nums @[250px]/card:text-lg">
            <div className="flex w-full justify-between items-center">
              <div className="flex gap-3 w-full items-center">
                <div className="h-11 w-11 rounded-full bg-primary/20 text-primary-foreground flex items-center justify-center font-semibold">
                  {officer.initials}
                </div>
                <div className="flex flex-col">
                  <h1>{officer.name}</h1>
                  <CardDescription className="font-normal text-sm">
                    {officer.unit}
                  </CardDescription>
                </div>
              </div>
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardAction className="px-5">
          <Badge
            variant={officer.status === "active" ? "default" : "destructive"}
            className="px-6"
          >
            {officer.status === "active" ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </CardAction>
        <CardContent className="p-0 space-y-4 px-7 text-muted-foreground text-[0.85rem]">
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
        </CardContent>

        <CardFooter className="flex gap-3 px-5 pb-5">
          {onDelete && (
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {officer.status === "active" ? (
            <Button variant="default" className="flex-1" onClick={onDeactivate}>
              Deactivate
            </Button>
          ) : (
            <Button variant="default" className="flex-1" onClick={onReactivate}>
              Reactivate
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
