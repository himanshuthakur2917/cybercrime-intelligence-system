import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatusSectionCardsProps {
  pendingWarrants: number;
  approvedWarrants: number;
  rejectedWarrants: number;
}

export function StatusSectionCards({
  pendingWarrants,
  approvedWarrants,
  rejectedWarrants,
}: StatusSectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardDescription>Pending Approval</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pendingWarrants}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Awaiting review <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Warrants pending officer approval
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardDescription>Approved Warrants</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {approvedWarrants}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Successfully approved warrants
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardDescription>Rejected Warrants</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {rejectedWarrants}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -8%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down this month <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Warrant rejections</div>
        </CardFooter>
      </Card>
    </div>
  );
}
