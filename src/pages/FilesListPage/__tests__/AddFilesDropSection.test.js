import useRCloneClient from 'hooks/rclone/useRCloneClient';
import { customRender, fireEvent, waitFor } from 'test-utils/react';
import AddFilesDropSection from '../AddFilesDropSection';

jest.mock('hooks/rclone/useRCloneClient');

describe('AddFilesDropSection', () => {
  const uploadFiles = jest.fn();

  beforeEach(() => {
    uploadFiles.mockResolvedValue();
    useRCloneClient.mockReturnValue({
      uploadFiles,
    });
  });

  it('should upload files recursively given content were drag and dropped to drop section', async () => {
    const dataTransferItems = createDataTransferItems([
      {
        isFile: true,
        fullPath: 'Pictures/dog.png',
        file: new File(['(⌐□_□)'], 'dog.png', { type: 'image/png' }),
      },
      {
        isFile: false,
        fullPath: 'Pictures/2021',
        items: [
          {
            isFile: true,
            fullPath: 'Pictures/2021/fireworks.png',
            file: new File(['A'], 'fireworks.png', { type: 'image/png' }),
          },
        ],
      },
    ]);

    const component = renderComponent();
    const dropSection = component.getByTestId('add-files-drop-section');
    fireEvent.dragEnter(dropSection);
    fireEvent.drop(dropSection, { dataTransfer: { items: dataTransferItems } });
    fireEvent.dragEnd(dropSection);

    await waitFor(() => {
      expect(uploadFiles).toBeCalledWith(
        'gdrive',
        'Documents/Pictures',
        expect.any(File)
      );
      expect(uploadFiles).toBeCalledWith(
        'gdrive',
        'Documents/Pictures/2021',
        expect.any(File)
      );
    });
  });

  it('should render drop section correctly when user enters the drag region', () => {});

  it('should render drop section correctly when user leaves the drag region', () => {});

  const createDataTransferItems = (root) => {
    return root.map((item) => {
      if (item.isFile) {
        return {
          webkitGetAsEntry: () => ({
            isFile: true,
            isDirectory: false,
            fullPath: item.fullPath,
            file: (resolve) => resolve(item.file),
          }),
        };
      }

      const subEntries = createDataTransferItems(item.items).map((item) =>
        item.webkitGetAsEntry()
      );

      return {
        webkitGetAsEntry: () => ({
          isFile: false,
          isDirectory: true,
          fullPath: item.fullPath,
          createReader: () => {
            let curIdx = 0;
            return {
              readEntries: (resolve) => {
                const items = subEntries.splice(curIdx);
                curIdx += 1;
                resolve(items);
              },
            };
          },
        }),
      };
    });
  };

  const renderComponent = () => {
    const onUploadedFiles = jest.fn();
    const component = customRender(
      <AddFilesDropSection
        remote="gdrive"
        folderPath="Documents"
        onUploadedFiles={onUploadedFiles}
      />
    );
    component.onUploadedFiles = onUploadedFiles;
    return component;
  };
});
