import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from '@/lib/supabase';

interface TeacherSelectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function TeacherCombobox({ value, onChange }: TeacherSelectionProps) {
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('kullanicilar')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('Öğretmen listesi getirilirken hata:', error);
          return;
        }

        console.log('Öğretmenler yüklendi:', data?.length || 0, 'kayıt');
        data?.forEach((teacher, index) => {
          console.log(`${index + 1}. Öğretmen: ${teacher.name}`);
        });

        setTeachers(data || []);
      } catch (error) {
        console.error('Öğretmen listesi getirilirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild id="teacher-trigger">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? teachers.find((teacher) => teacher.id === value)?.name || "Öğretmen Seçin"
            : "Öğretmen Seçin"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Öğretmen ara..." />
          <CommandEmpty>Öğretmen bulunamadı.</CommandEmpty>
          {loading ? (
            <div className="py-6 text-center text-sm">Yükleniyor...</div>
          ) : (
            <CommandGroup>
              {teachers.map((teacher) => (
                <CommandItem
                  key={teacher.id}
                  value={teacher.name}
                  onSelect={() => {
                    onChange(teacher.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === teacher.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {teacher.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
} 