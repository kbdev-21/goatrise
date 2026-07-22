import { useEffect, useState } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  useCollection,
  useDeleteCollection,
  useUpdateCollection,
} from "@/api/collection/query-hooks.ts";
import type { Collection, UpdateCollectionRequest } from "@/api/collection/api.ts";
import { useProducts } from "@/api/product/query-hooks.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import CollectionInfoForm, {
  type CollectionInfoFormValue,
} from "./CollectionInfoForm.tsx";

export default function CollectionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const collectionQuery = useCollection(id ?? "");
  const updateCollectionMutation = useUpdateCollection();
  const productsQuery = useProducts();

  const [value, setValue] = useState<CollectionInfoFormValue | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);

  // seed form từ collection khi load xong
  useEffect(() => {
    if (collectionQuery.data) {
      setValue(collectionToFormValue(collectionQuery.data));
    }
  }, [collectionQuery.data]);

  const isDirty =
    !!value &&
    !!collectionQuery.data &&
    JSON.stringify(value) !== JSON.stringify(collectionToFormValue(collectionQuery.data));

  const canSave =
    !!value &&
    value.slug.trim().length > 0 &&
    value.titleEn.trim().length > 0 &&
    value.titleVi.trim().length > 0 &&
    value.shortDescriptionEn.trim().length > 0 &&
    value.shortDescriptionVi.trim().length > 0 &&
    isDirty;

  function handleSave() {
    if (!id || !value) return;

    const imgUrl = value.imgUrl.trim();

    const request: UpdateCollectionRequest = {
      slug: value.slug.trim(),
      type: value.type,
      title: { en: value.titleEn.trim(), vi: value.titleVi.trim() },
      shortDescription: {
        en: value.shortDescriptionEn.trim(),
        vi: value.shortDescriptionVi.trim(),
      },
      imgUrl: imgUrl || null,
      isActive: value.isActive,
      priority: Number(value.priority) || 0,
      productIds: value.productIds,
    };

    updateCollectionMutation.mutate(
      { collectionId: id, request },
      {
        onSuccess: (collection) => {
          toast.success(`Updated collection ${collection.title.en}`);
          navigate("/collections");
        },
        onError: (error) => {
          toast.error(
            isAxiosError(error) && typeof error.response?.data === "string"
              ? error.response.data
              : "Failed to update collection",
          );
        },
      },
    );
  }

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => navigate("/collections")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-medium">Collection Detail</h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="ml-auto">
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              disabled={!collectionQuery.data}
              onClick={() =>
                collectionQuery.data && setDeletingCollection(collectionQuery.data)
              }
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          disabled={!canSave || updateCollectionMutation.isPending}
          onClick={handleSave}
        >
          {updateCollectionMutation.isPending ? (
            <Spinner />
          ) : (
            <Save className="size-4" />
          )}
          Save
        </Button>
      </div>

      {collectionQuery.isError ? (
        <div className="bg-card text-destructive rounded-md border p-6 text-sm">
          Failed to load collection.
        </div>
      ) : !value ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <CollectionInfoForm
          value={value}
          onChange={setValue}
          products={productsQuery.data ?? []}
        />
      )}

      <DeleteCollectionDialog
        collection={deletingCollection}
        onClose={() => setDeletingCollection(null)}
      />
    </div>
  );
}

function DeleteCollectionDialog({
  collection,
  onClose,
}: {
  collection: Collection | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const deleteCollectionMutation = useDeleteCollection();

  return (
    <Dialog open={!!collection} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete collection</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-xs">
          This will permanently delete{" "}
          <span className="text-foreground font-medium">{collection?.title.en}</span>. This
          only removes the collection and its product links, not the products themselves.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteCollectionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteCollectionMutation.isPending}
            onClick={() => {
              if (!collection) return;
              deleteCollectionMutation.mutate(collection.id, {
                onSuccess: () => {
                  toast.success(`Deleted collection ${collection.title.en}`);
                  navigate("/collections");
                },
                onError: (error) => {
                  toast.error(
                    isAxiosError(error) && typeof error.response?.data === "string"
                      ? error.response.data
                      : "Failed to delete collection",
                  );
                },
              });
            }}
          >
            {deleteCollectionMutation.isPending && <Spinner />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function collectionToFormValue(collection: Collection): CollectionInfoFormValue {
  return {
    slug: collection.slug,
    type: collection.type,
    titleEn: collection.title.en,
    titleVi: collection.title.vi,
    shortDescriptionEn: collection.shortDescription.en,
    shortDescriptionVi: collection.shortDescription.vi,
    imgUrl: collection.imgUrl ?? "",
    priority: String(collection.priority),
    isActive: collection.isActive,
    productIds: collection.products.map((product) => product.id),
  };
}
