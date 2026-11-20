'use client';

import React, { useState, type ReactNode } from 'react';
import { Lock, SearchX, Volume2, X } from 'lucide-react';
import QuitDialog, {
  DUEL_FORFEIT_COPY,
  SOLO_QUIT_COPY,
  type QuitDialogCopy,
} from '@/components/game/QuitDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PRACTICE_OVER_RUN_COPY, PRACTICE_QUIT_COPY } from '@/lib/practice';

const DIALOG_COPIES: readonly QuitDialogCopy[] = [
  SOLO_QUIT_COPY,
  DUEL_FORFEIT_COPY,
  PRACTICE_QUIT_COPY,
  PRACTICE_OVER_RUN_COPY,
];

const TAG_TONES = [
  ['green', 'Win'],
  ['amber', 'Pending'],
  ['red', 'Loss'],
  ['blue', 'Solo'],
  ['purple', 'Friend'],
  ['yellow', 'Draw'],
  ['grey', 'Guest'],
  ['neutral', 'Practice'],
] as const;

const BLOCKS = [
  'bg-surface',
  'bg-block-lavender',
  'bg-block-mint',
  'bg-block-butter',
  'bg-block-coral',
] as const;

const HEADSHOT = '/mock/players/headshot-1.svg';

type SectionProps = { title: string; children: ReactNode };

const Section = ({ title, children }: SectionProps) => {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-20 font-semibold">{title}</h2>
      {children}
    </section>
  );
};

type RowProps = { children: ReactNode };

const Row = ({ children }: RowProps) => {
  return <div className="flex flex-wrap items-center gap-4">{children}</div>;
};

type ButtonsSectionProps = {};

const ButtonsSection = ({}: ButtonsSectionProps) => {
  return (
    <Section title="Button">
      <Row>
        <Button>Start solo run</Button>
        <Button variant="secondary">Back to play</Button>
        <Button disabled>Starting…</Button>
        <Button variant="secondary" disabled>
          Show more
        </Button>
        <Button size="large">Play again</Button>
        <Button variant="secondary" size="large">
          Change filters
        </Button>
      </Row>
      <Row>
        <Button variant="secondary" size="icon" aria-label="Sound on">
          <Volume2 aria-hidden="true" />
        </Button>
        <Button variant="secondary">
          <X aria-hidden="true" />
          Quit
        </Button>
        <Button className="translate-x-1 translate-y-1 shadow-none">
          Pressed
        </Button>
      </Row>
    </Section>
  );
};

type InputsSectionProps = {};

const InputsSection = ({}: InputsSectionProps) => {
  return (
    <Section title="Input and label">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dev-empty">Email</Label>
          <Input id="dev-empty" placeholder="you@example.com" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dev-filled">Handle</Label>
          <Input id="dev-filled" defaultValue="deadball_dan" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dev-error">Password</Label>
          <Input
            id="dev-error"
            type="password"
            defaultValue="short"
            aria-invalid="true"
            aria-describedby="dev-error-text"
          />
          <p id="dev-error-text" className="text-14 text-danger-text">
            Use at least 8 characters.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dev-readonly">Room code</Label>
          <Input id="dev-readonly" readOnly defaultValue="K7QM2X" />
        </div>
      </div>
    </Section>
  );
};

type ControlsSectionProps = {};

const ControlsSection = ({}: ControlsSectionProps) => {
  const [isPractice, setIsPractice] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);

  return (
    <Section title="Checkbox, switch, tabs">
      <Row>
        <label className="flex items-center gap-2 text-14">
          <Checkbox checked={isPractice} onCheckedChange={setIsPractice} />
          Practice: no clock, no lives, not saved
        </label>
        <label className="flex items-center gap-2 text-14">
          <Checkbox defaultChecked disabled />
          Locked on
        </label>
        <label className="flex items-center gap-2 text-14">
          <Checkbox disabled />
          Locked off
        </label>
      </Row>
      <Row>
        <label className="flex items-center gap-2 text-14">
          <Switch checked={isSoundOn} onCheckedChange={setIsSoundOn} />
          Sound {isSoundOn ? 'on' : 'off'}
        </label>
        <label className="flex items-center gap-2 text-14">
          <Switch disabled />
          Disabled
        </label>
      </Row>
      <Row>
        <Tabs defaultValue="sign-in">
          <TabsList>
            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
            <TabsTrigger value="create">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in" className="text-14 text-fg-muted">
            Sign in with your email.
          </TabsContent>
          <TabsContent value="create" className="text-14 text-fg-muted">
            Create an account to keep your history.
          </TabsContent>
        </Tabs>
        <Tabs defaultValue="any">
          <TabsList>
            <TabsTrigger value="any">Any</TabsTrigger>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="away">Away</TabsTrigger>
          </TabsList>
        </Tabs>
      </Row>
    </Section>
  );
};

type CardsSectionProps = {};

const CardsSection = ({}: CardsSectionProps) => {
  return (
    <Section title="Card">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BLOCKS.map((block) => (
          <div key={block} className={`rounded-lg p-4 ${block}`}>
            <Card>
              <CardHeader>
                <CardTitle>Run ended</CardTitle>
                <CardDescription>
                  7 of 11 named · {block.slice(3)}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-14">
                Best streak 4, accuracy 64%.
              </CardContent>
              <CardFooter>
                <Button>Play again</Button>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
    </Section>
  );
};

type BadgesSectionProps = {};

const BadgesSection = ({}: BadgesSectionProps) => {
  return (
    <Section title="Badge and sticker">
      <Row>
        {TAG_TONES.map(([tone, label]) => (
          <Badge key={tone} tone={tone}>
            {label}
          </Badge>
        ))}
        <Badge tone="brand">
          <Lock aria-hidden="true" />
          Pro
        </Badge>
      </Row>
      <Row>
        <Badge variant="sticker" tone="you">
          Your turn
        </Badge>
        <Badge variant="sticker" tone="opponent" tilt="right">
          Your turn
        </Badge>
        <Badge variant="sticker" tone="found">
          Found
        </Badge>
        <Badge variant="sticker" tone="brand" tilt="right">
          Pro
        </Badge>
        <Badge variant="sticker" tone="butter">
          Practice
        </Badge>
      </Row>
    </Section>
  );
};

type AvatarsSectionProps = {};

const AvatarsSection = ({}: AvatarsSectionProps) => {
  return (
    <Section title="Avatar">
      <Row>
        <Avatar size="lg">
          <AvatarImage src={HEADSHOT} alt="" />
          <AvatarFallback>WT</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>JL</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback />
        </Avatar>
        <Avatar tone="you">
          <AvatarFallback>GP</AvatarFallback>
        </Avatar>
        <Avatar tone="opponent">
          <AvatarFallback>RH</AvatarFallback>
        </Avatar>
        <Avatar size="sm" tone="you">
          <AvatarFallback>İŞ</AvatarFallback>
        </Avatar>
      </Row>
    </Section>
  );
};

type DialogsSectionProps = {};

const DialogsSection = ({}: DialogsSectionProps) => {
  const [open, setOpen] = useState<QuitDialogCopy | null>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <Section title="Alert dialog">
      <Row>
        {DIALOG_COPIES.map((copy) => (
          <Button
            key={copy.title}
            variant="secondary"
            onClick={() => {
              setIsPending(false);
              setOpen(copy);
            }}
          >
            {copy.title}
          </Button>
        ))}
      </Row>
      <QuitDialog
        isOpen={open !== null}
        isQuitting={isPending}
        copy={open ?? SOLO_QUIT_COPY}
        onDismiss={() => setOpen(null)}
        onConfirm={() => setIsPending(true)}
      />
    </Section>
  );
};

type LoadingAndEmptySectionProps = {};

const LoadingAndEmptySection = ({}: LoadingAndEmptySectionProps) => {
  return (
    <Section title="Skeleton and empty">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <SearchX aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No match fits</EmptyTitle>
          <EmptyDescription>
            Try fewer words, or clear the filters.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="secondary">Clear search</Button>
        </EmptyContent>
      </Empty>
    </Section>
  );
};

type ComponentsPreviewProps = {};

export const ComponentsPreview = ({}: ComponentsPreviewProps) => {
  return (
    <>
      <ButtonsSection />
      <InputsSection />
      <ControlsSection />
      <CardsSection />
      <BadgesSection />
      <AvatarsSection />
      <DialogsSection />
      <LoadingAndEmptySection />
    </>
  );
};
