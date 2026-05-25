import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Styled modal replacement for window.prompt() — one or two text fields.
 */
export default function HmFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields = [{ name: "value", label: "Name", placeholder: "" }],
  initialValues = {},
  submitLabel = "Save",
  onSubmit,
}) {
  const [values, setValues] = useState({});

  useEffect(() => {
    if (!open) return;
    const next = {};
    for (const f of fields) {
      next[f.name] = initialValues[f.name] ?? "";
    }
    setValues(next);
  }, [open, fields, initialValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const out = {};
    for (const f of fields) {
      out[f.name] = String(values[f.name] ?? "").trim();
    }
    onSubmit?.(out);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-body sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display">{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {fields.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={`hm-dialog-${f.name}`} className="text-sm font-semibold">
                  {f.label}
                </Label>
                <Input
                  id={`hm-dialog-${f.name}`}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="rounded-xl"
                  autoFocus={fields[0]?.name === f.name}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-copper rounded-xl text-primary-foreground">
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
