// Quick book/chapter jump modal.
import React, { useState } from "react";
import { View, Text, Modal, Pressable, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Book } from "../db/content";
import { colors, fonts, spacing, type } from "../theme";

export function PassagePicker({
  books,
  visible,
  onClose,
  onPick,
}: {
  books: Book[];
  visible: boolean;
  onClose: () => void;
  onPick: (bookNum: number, chapter: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [book, setBook] = useState<Book | null>(null);

  const close = () => {
    setBook(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: colors.parchment }}>
        <View
          style={{
            padding: spacing.m,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottomWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          {book ? (
            <Pressable onPress={() => setBook(null)} hitSlop={12}>
              <Text style={{ fontFamily: fonts.sansMed, color: colors.goldDeep, fontSize: 15 }}>‹ Books</Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}
          <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.navyDeep }}>
            {book ? book.name : "Go to passage"}
          </Text>
          <Pressable onPress={close} hitSlop={12}>
            <Text style={{ fontFamily: fonts.sansMed, color: colors.inkMuted, fontSize: 15 }}>Close</Text>
          </Pressable>
        </View>
        {book ? (
          <FlatList
            data={Array.from({ length: book.chapters_count }, (_, i) => i + 1)}
            numColumns={5}
            keyExtractor={(n) => String(n)}
            contentContainerStyle={{ padding: spacing.m, paddingBottom: insets.bottom + spacing.l }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onPick(book.book_num, item);
                  close();
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  margin: 4,
                  aspectRatio: 1,
                  maxWidth: "18%",
                  borderRadius: 12,
                  backgroundColor: pressed ? colors.goldSoft : colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Text style={{ fontFamily: fonts.serifSemi, fontSize: 16, color: colors.ink }}>{item}</Text>
              </Pressable>
            )}
          />
        ) : (
          <FlatList
            data={books}
            keyExtractor={(b) => String(b.book_num)}
            contentContainerStyle={{ padding: spacing.m, paddingBottom: insets.bottom + spacing.l }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setBook(item)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.parchmentAlt : colors.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: spacing.m,
                  paddingVertical: 12,
                  marginBottom: 6,
                  flexDirection: "row",
                  justifyContent: "space-between",
                })}
              >
                <Text style={{ fontFamily: fonts.serifSemi, fontSize: 15, color: colors.ink }}>{item.name}</Text>
                <Text style={type.caption}>{item.chapters_count}</Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}
