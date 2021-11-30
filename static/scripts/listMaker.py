import os

texturePath = "../Korean"

def extractList(f):
    textList = []

    for line in f.readlines():
        textList.append(line.split('\t'))

    return textList

def appendChild(mN, f, l1, l2):
    found = False

    for line in l1 + l2:
        if len(line) > 0 and line[0] == mN:
            found = True
            f.write('\t'.join(line))
            break

    if not found:
        f.write(mN + '\n')


def main():
    f = open("res/textureList.txt", 'w')
    txt1 = open("../../list.txt", 'r')
    txt2 = open("../../list_jp.txt", 'r')

    list1 = extractList(txt1)
    list2 = extractList(txt2)

    for mN in next(os.walk(texturePath))[1]:
        if mN[0] == 'c' or mN[0] == 'm' or mN[0] == 's' or mN[0] == 'x':
            appendChild(mN, f, list1, list2)

    f.close()
    txt1.close()
    txt2.close()


if __name__ == "__main__":
    main()
