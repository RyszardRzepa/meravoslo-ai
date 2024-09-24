"use client";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addNewTag, getTags, updateTagById } from "@/app/admin/actions/tags";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Tag {
  id: number;
  name: string;
}

const debounce = (fn: (tag: Tag) => void, ms = 500) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, tag: Tag) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, [tag]), ms);
  };
};

const debouncedUpdate = debounce(updateTagById);

export default function TagsTable(props: { tags: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(props.tags);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim() !== "") {
      const newTagObj = { id: tags[tags.length - 1].id + 1, name: newTag };
      setNewTag(newTag);
      setTags([...tags, newTagObj]);
      debounce(() => addNewTag(newTag.trim()).then(() => getTags()));
    }
  };

  const handleEditTag = (id: number, newName: string) => {
    setTags(
      tags.map((tag) =>
        tag.id === id ? { ...tag, name: newName } : tag
      )
    );
    debouncedUpdate({ id, name: newName.trim() });
  };

  return (
    <>
      <ScrollArea className="flex flex-col gap-4 max-h-80 rounded-md border">
        <div className="">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>{tag.id}</TableCell>
                  <TableCell>
                    <Input
                      value={tag.name}
                      onChange={(e) => handleEditTag(tag.id, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
      <div className="mt-4 flex gap-2">
        <Input
          placeholder="Enter new tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <Button type="button" onClick={handleAddTag}>Add Tag</Button>
      </div>
    </>
  );
}
