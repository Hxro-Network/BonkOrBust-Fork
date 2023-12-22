// src/components/Dropdown.tsx

import React, { FC } from "react";
import { Menu, MenuButton, MenuList, MenuItem, Button, Box } from "@chakra-ui/react";

interface DropdownProps {
  options: string[];
  onSelect: (value: string) => void;
  title: string;
}

export const Dropdown: FC<DropdownProps> = ({ title, options, onSelect }) => {
  return (
    <Box color="black">
      <Menu>
        <MenuButton
          fontSize="2xl"
          as={Button}
          backgroundColor="#FCD014"
          _hover={{ backgroundColor: "#FCD014" }}
        >
          {title}
        </MenuButton>
        <MenuList backgroundColor="#FCD014">
          {options.map((option, index) => (
            <MenuItem key={index} onClick={() => onSelect(option)}>
              {option}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};
