import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useCreateItem } from "@/api/item/query-hooks.ts";
import type { CreateItemRequest, ItemAttributeValues } from "@/api/item/api.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import ItemInfoForm, { EMPTY_ITEM_INFO_FORM_VALUE, type ItemInfoFormValue } from "./ItemInfoForm.tsx";

// TODO: thay bằng data từ products API khi có
const PLACEHOLDER_PRODUCTS: { name: string }[] = [
  { name: "Product A" },
  { name: "Product B" },
  { name: "Product C" },
];

export default function CreateItemPage() {
  const navigate = useNavigate();
  const createItemMutation = useCreateItem();

  const [value, setValue] = useState<ItemInfoFormValue>(EMPTY_ITEM_INFO_FORM_VALUE);

  const canSave =
    value.sku.trim().length > 0 &&
    value.name.trim().length > 0 &&
    value.price.trim().length > 0;
  
  function handleSave() {
    const attributeValues: ItemAttributeValues = {};
    if (value.colorEnabled) {
      attributeValues.COLOR = {
        hex: value.colorHex.trim(),
        enText: value.colorEnText.trim(),
        viText: value.colorViText.trim(),
      };
    }
    if (value.sizeEnabled) {
      attributeValues.SIZE = value.size.trim();
    }

    const request: CreateItemRequest = {
      sku: value.sku.trim(),
      name: value.name.trim(),
      price: Number(value.price),
      note: value.note.trim() || undefined,
      imgUrl: value.imgUrl.trim() || undefined,
      weight: value.weight ? Number(value.weight) : undefined,
      productId: value.productId ?? undefined,
      attributeValues: attributeValues,
    };

    createItemMutation.mutate(request, {
      onSuccess: () => {
        toast.success(`Created item successfully!`);
        navigate("/items");
      },
      onError: (error) => {
        toast.error(
          isAxiosError(error) && typeof error.response?.data === "string"
            ? error.response.data
            : "Failed to create item",
        );
      },
    });
  }

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => navigate("/items")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-medium">New Item</h1>

        <Button
          type="button"
          className="ml-auto"
          disabled={!canSave || createItemMutation.isPending}
          onClick={handleSave}
        >
          {createItemMutation.isPending ? (
            <Spinner />
          ) : (
            <Save className="size-4" />
          )}
          Save
        </Button>
      </div>

      <ItemInfoForm value={value} onChange={setValue} products={PLACEHOLDER_PRODUCTS} />
    </div>
  );
}
