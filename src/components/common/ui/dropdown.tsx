import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectValue,
  SelectSeparator,
} from './select';

const MyDropdown = () => {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Layouts</SelectLabel>
          <SelectItem value="option1">Minimal layout</SelectItem>
          <SelectItem value="option2">Default Layout</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>More Options</SelectLabel>
          <SelectItem value="option4">Option 4</SelectItem>
          <SelectItem value="option5">Option 5</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default MyDropdown;
