import { useMemo, useState } from "react";
import { Eye, ImageOff, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCollections } from "@/api/collection/query-hooks.ts";
import type { Collection, CollectionType } from "@/api/collection/api.ts";
import { capitalize, normalizeVietnameseString } from "@/core/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
import { ActiveBadge } from "@/components/shared/active-badge.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";

const TYPE_OPTIONS: { label: string; value: CollectionType }[] = [
  { label: "Collection", value: "COLLECTION" },
  { label: "Category", value: "CATEGORY" },
  { label: "Event", value: "EVENT" },
];

const TYPE_ALL = "ALL";

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest", value: "createdAt:DESC" },
  { label: "Oldest", value: "createdAt:ASC" },
  { label: "Priority (high→low)", value: "priority:DESC" },
  { label: "Priority (low→high)", value: "priority:ASC" },
];

export default function CollectionsPage() {
  const navigate = useNavigate();

  // ----- client-side query state -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<CollectionType | typeof TYPE_ALL>(TYPE_ALL);
  const [sort, setSort] = useState<string>("createdAt:DESC");

  // fetch toàn bộ 1 lần rồi filter phía client
  const collectionsQuery = useCollections();

  function commitSearch() {
    setSearch(searchInput.trim());
  }

  const filteredCollections = useMemo(() => {
    const collections = collectionsQuery.data ?? [];
    const keyword = normalizeVietnameseString(search);
    return collections.filter((collection) => {
      if (type !== TYPE_ALL && collection.type !== type) return false;
      if (!keyword) return true;
      return normalizeVietnameseString(
        `${collection.slug} ${collection.title.en} ${collection.title.vi}`,
      ).includes(keyword);
    });
  }, [collectionsQuery.data, search, type]);

  const sortedCollections = useMemo(() => {
    const [field, direction] = sort.split(":");
    const factor = direction === "ASC" ? 1 : -1;
    return [...filteredCollections].sort((a, b) => {
      let cmp: number;
      switch (field) {
        case "priority":
          cmp = a.priority - b.priority;
          break;
        default:
          cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return cmp * factor;
    });
  }, [filteredCollections, sort]);

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Collections</h1>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search slug or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSearch();
            }}
            className="bg-card pr-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={commitSearch}
            aria-label="Search"
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
          >
            <Search className="size-3.5" />
          </Button>
        </div>

        <Select
          value={type}
          onValueChange={(value) => setType(value as CollectionType | typeof TYPE_ALL)}
        >
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TYPE_ALL}>All types</SelectItem>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-48 bg-card">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          className="ml-auto"
          onClick={() => navigate("/collections/create")}
        >
          <Plus className="size-4" />
          New Collection
        </Button>
      </div>

      {/* ----- table ----- */}
      {collectionsQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collectionsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-destructive text-center">
                    Failed to load collections.
                  </TableCell>
                </TableRow>
              ) : sortedCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No collections found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedCollections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell className="font-mono text-xs">{collection.slug}</TableCell>
                    <TableCell className="font-medium">
                      <div
                        className="flex w-fit cursor-pointer items-center gap-2"
                        onClick={() => navigate(`/collections/${collection.id}`)}
                      >
                        <CollectionImage collection={collection} />
                        <span className="hover:underline">{collection.title.en}</span>
                      </div>
                    </TableCell>
                    <TableCell>{capitalize(collection.type)}</TableCell>
                    <TableCell>
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => navigate(`/collections/${collection.id}`)}
                      >
                        {collection.products.length} product
                        {collection.products.length === 1 ? "" : "s"}
                      </span>
                    </TableCell>
                    <TableCell>{collection.priority}</TableCell>
                    <TableCell>
                      <ActiveBadge isActive={collection.isActive} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View details"
                          title="View details"
                          onClick={() => navigate(`/collections/${collection.id}`)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ----- footer ----- */}
      <span className="text-muted-foreground text-xs">
        {filteredCollections.length} collection
        {filteredCollections.length === 1 ? "" : "s"}
        {collectionsQuery.isFetching ? " · updating..." : ""}
      </span>
    </div>
  );
}

function CollectionImage({ collection }: { collection: Collection }) {
  const [error, setError] = useState(false);
  return collection.imgUrl && !error ? (
    <img
      src={collection.imgUrl}
      alt={collection.title.en}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className="size-8 shrink-0 rounded object-cover"
    />
  ) : (
    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded">
      <ImageOff className="size-4" />
    </div>
  );
}
