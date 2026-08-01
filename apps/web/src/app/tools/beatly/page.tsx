'use client';

import { useCallback, useState } from 'react';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Label } from '@workspace/ui/components/label';
import { RainbowButton } from '@workspace/ui/components/rainbow-button';
import { Separator } from '@workspace/ui/components/separator';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  ChevronDown,
  ExternalLink,
  Globe,
  Headphones,
  Lightbulb,
  Music,
  Music2,
  Plus,
  RefreshCw,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { GENRES, RANDOM_MOODS } from '@/lib/beatly-data';
import type { Song } from '@/types/beatly';

export default function BeatlyPage() {
  const [mood, setMood] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [displayedSongs, setDisplayedSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);

  const handleMoodChange = useCallback((value: string) => {
    setMood(value);
  }, []);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev => {
      const next = new Set(prev);
      if (next.has(genre)) {
        next.delete(genre);
      } else {
        next.add(genre);
      }
      return next;
    });
  }, []);

  const handleRandomMood = useCallback(() => {
    const randomMood =
      RANDOM_MOODS[Math.floor(Math.random() * RANDOM_MOODS.length)];
    setMood(randomMood);
    toast.success('Random mood generated!');
  }, []);

  const handleReset = useCallback(() => {
    setMood('');
    setSelectedGenres(new Set());
    setDisplayedSongs([]);
    toast.info('Reset complete');
  }, []);

  const handleRecommend = useCallback(async () => {
    if (!mood.trim()) {
      toast.error('Please describe your mood first');
      return;
    }

    setIsLoading(true);
    setDisplayedSongs([]);

    try {
      const genresArray = Array.from(selectedGenres);
      const songsResponse = await fetch('/api/beatly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood: mood.trim(),
          genres: genresArray.length > 0 ? genresArray : undefined,
        }),
      });

      if (!songsResponse.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await songsResponse.json();
      const recommendedSongs = data.songs || [];

      console.log('Recommended Songs:', recommendedSongs);

      setDisplayedSongs(recommendedSongs);
      toast.success(`Found ${recommendedSongs.length} songs for your mood!`);
    } catch (error) {
      console.error('Recommendation error:', error);
      toast.error('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [mood, selectedGenres]);

  const handleMoreSongs = useCallback(async () => {
    if (!mood.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get more song recommendations, excluding already displayed songs
      const excludedSongs = displayedSongs.map(
        s => `${s.title} by ${s.artist}`
      );
      const genresArray = Array.from(selectedGenres);

      const songsResponse = await fetch('/api/beatly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood: mood.trim(),
          genres: genresArray.length > 0 ? genresArray : undefined,
          excludedSongs,
        }),
      });

      if (!songsResponse.ok) {
        throw new Error('Failed to get more recommendations');
      }

      const data = await songsResponse.json();
      const newSongs = data.songs || [];

      setDisplayedSongs(prev => [...prev, ...newSongs]);
      toast.success(`Added ${newSongs.length} more songs!`);
    } catch (error) {
      console.error('More songs error:', error);
      toast.error('Failed to get more songs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [mood, selectedGenres, displayedSongs]);

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto">
          <ToolPageHeader
            title="Beatly"
            description="Discover music that matches your vibe. Describe your mood, select genres, and get personalized song recommendations."
            infoMessage="Powered by AI to understand your mood and recommend the perfect soundtrack for any moment."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Your Mood
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mood Input */}
                <div className="space-y-2">
                  <Label htmlFor="mood-input" className="text-base">
                    Describe your mood
                  </Label>
                  <Textarea
                    id="mood-input"
                    value={mood}
                    onChange={e => handleMoodChange(e.target.value)}
                    placeholder="e.g., melancholic sunset drive, energetic morning workout, rainy day reading..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    The more specific, the better the recommendations
                  </p>
                </div>

                <Separator />

                {/* Genre Selection */}
                <div className="space-y-3">
                  <Label className="text-base">
                    Filter by Genre (Optional)
                  </Label>
                  <Dialog
                    open={isGenreModalOpen}
                    onOpenChange={setIsGenreModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between hover:bg-accent"
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <Music2 className="h-4 w-4" />
                          {selectedGenres.size > 0
                            ? `${selectedGenres.size} selected`
                            : 'Select genres'}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] md:max-w-2xl lg:max-w-5xl max-h-[85vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Music2 className="h-5 w-5" />
                          Select Genres
                        </DialogTitle>
                      </DialogHeader>
                      <div className="overflow-y-auto max-h-[65vh] pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-0 gap-y-6">
                          {GENRES.map((genre, index) => (
                            <div
                              key={genre.name}
                              className={`space-y-3 px-6 ${index % 2 === 0 ? 'md:border-r md:pr-8' : 'md:pl-8'}`}
                            >
                              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                                {genre.name}
                                <span className="text-xs font-normal text-muted-foreground normal-case">
                                  ({genre.subgenres.length} subgenres)
                                </span>
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {genre.subgenres.map(subgenre => (
                                  <Badge
                                    key={subgenre}
                                    variant={
                                      selectedGenres.has(subgenre)
                                        ? 'default'
                                        : 'outline'
                                    }
                                    className="cursor-pointer transition-all hover:scale-105 text-xs py-1.5 px-3"
                                    onClick={() => toggleGenre(subgenre)}
                                  >
                                    {subgenre}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          {selectedGenres.size > 0 ? (
                            <span>
                              {selectedGenres.size} genre
                              {selectedGenres.size !== 1 ? 's' : ''} selected
                            </span>
                          ) : (
                            <span>No genres selected (all genres)</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {selectedGenres.size > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedGenres(new Set())}
                            >
                              Clear All
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => setIsGenreModalOpen(false)}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {selectedGenres.size > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-3 bg-accent/50 rounded-lg">
                      {Array.from(selectedGenres).map(genre => (
                        <Badge
                          key={genre}
                          variant="default"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={() => toggleGenre(genre)}
                        >
                          {genre}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                  <RainbowButton
                    onClick={handleRecommend}
                    disabled={isLoading || !mood.trim()}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <RefreshCw className="animate-spin" />
                    ) : (
                      <Sparkles />
                    )}
                    {isLoading ? 'Thinking...' : 'Get Recommendations'}
                  </RainbowButton>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleRandomMood}
                      variant="secondary"
                      size="sm"
                      disabled={isLoading}
                    >
                      <Shuffle />
                      Random
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="secondary"
                      size="sm"
                      disabled={isLoading}
                    >
                      <RefreshCw />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Area */}
            <div className="lg:col-span-2">
              {displayedSongs.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Your Playlist
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {displayedSongs.length}{' '}
                        {displayedSongs.length === 1 ? 'song' : 'songs'} matched
                        to your mood
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {displayedSongs.map((song, index) => (
                      <Card
                        key={index}
                        className="overflow-hidden transition-all hover:shadow-md hover:border-primary/50 group"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                    {song.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                    {song.artist}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 pl-11 flex items-start gap-1.5">
                                <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <span>{song.reason}</span>
                              </p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => {
                                  const query = encodeURIComponent(
                                    `${song.title} ${song.artist}`
                                  );
                                  window.open(
                                    `https://www.youtube.com/results?search_query=${query}`,
                                    '_blank'
                                  );
                                }}
                                title="Search on YouTube"
                              >
                                <ExternalLink />
                                <span className="hidden sm:inline">
                                  YouTube
                                </span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => {
                                  const query = encodeURIComponent(
                                    `${song.title} ${song.artist}`
                                  );
                                  window.open(
                                    `https://open.spotify.com/search/${query}`,
                                    '_blank'
                                  );
                                }}
                                title="Search on Spotify"
                              >
                                <ExternalLink />
                                <span className="hidden sm:inline">
                                  Spotify
                                </span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button
                    onClick={handleMoreSongs}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <RefreshCw className="animate-spin" />
                    ) : (
                      <Plus />
                    )}
                    {isLoading
                      ? 'Finding more songs...'
                      : 'Generate More Songs'}
                  </Button>
                </div>
              ) : (
                <Card className="h-full min-h-[500px] flex items-center justify-center">
                  <CardContent className="text-center space-y-4 py-12">
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Music className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">
                        Ready to discover music?
                      </h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Describe your mood on the left and let AI find the
                        perfect songs for you
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center pt-4">
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                      >
                        <Music2 className="h-3 w-3" />
                        Any genre
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        Multi-language
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI-powered
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
